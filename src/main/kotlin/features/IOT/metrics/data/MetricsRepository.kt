package com.example.features.IOT.metrics.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.Metrics1mKv
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.withDistinct
import java.time.LocalDateTime
import java.util.UUID
import kotlin.math.max
import kotlin.math.min

class MetricsRepository {

    data class MetricRecord(
        val transformerId: UUID,
        val key: String,
        val bucketTs: LocalDateTime,
        val avgValue: Double?,
        val minValue: Double?,
        val maxValue: Double?,
        val count: Int,
        val unit: String?,
        val label: String?,
    )

    private fun rowToRecord(row: ResultRow) = MetricRecord(
        transformerId = UUID.fromString(row[Metrics1mKv.transformerId]),
        key = row[Metrics1mKv.key],
        bucketTs = row[Metrics1mKv.bucketTs],
        avgValue = row[Metrics1mKv.avgValue],
        minValue = row[Metrics1mKv.minValue],
        maxValue = row[Metrics1mKv.maxValue],
        count = row[Metrics1mKv.count],
        unit = row[Metrics1mKv.unit],
        label = row[Metrics1mKv.label],
    )

    suspend fun listKeys(transformerId: UUID): List<String> = dbQuery {
        Metrics1mKv
            .slice(Metrics1mKv.key)
            .selectAll()
            .where { Metrics1mKv.transformerId eq transformerId.toString() }
            .withDistinct()
            .orderBy(Metrics1mKv.key to SortOrder.ASC)
            .map { it[Metrics1mKv.key] }
    }

    suspend fun list(
        transformerId: UUID,
        key: String,
        limit: Int,
        from: LocalDateTime?,
        to: LocalDateTime?,
        orderAsc: Boolean,
    ): List<MetricRecord> = dbQuery {
        var condition: Op<Boolean> = Metrics1mKv.transformerId eq transformerId.toString()
        condition = condition and (Metrics1mKv.key eq key)
        if (from != null) {
            condition = condition and (Metrics1mKv.bucketTs greaterEq from)
        }
        if (to != null) {
            condition = condition and (Metrics1mKv.bucketTs lessEq to)
        }
        Metrics1mKv
            .selectAll()
            .where { condition }
            .orderBy(Metrics1mKv.bucketTs to if (orderAsc) SortOrder.ASC else SortOrder.DESC)
            .limit(limit)
            .map(::rowToRecord)
    }

    suspend fun upsertValue(
        transformerId: UUID,
        key: String,
        bucketTs: LocalDateTime,
        value: Double,
        unit: String?,
        label: String?,
    ): MetricRecord = dbQuery {
        val existing = Metrics1mKv
            .selectAll()
            .where {
                (Metrics1mKv.transformerId eq transformerId.toString()) and
                    (Metrics1mKv.key eq key) and
                    (Metrics1mKv.bucketTs eq bucketTs)
            }
            .firstOrNull()

        if (existing == null) {
            Metrics1mKv.insert { row ->
                row[Metrics1mKv.transformerId] = transformerId.toString()
                row[Metrics1mKv.key] = key
                row[Metrics1mKv.bucketTs] = bucketTs
                row[Metrics1mKv.avgValue] = value
                row[Metrics1mKv.minValue] = value
                row[Metrics1mKv.maxValue] = value
                row[Metrics1mKv.count] = 1
                row[Metrics1mKv.unit] = unit
                row[Metrics1mKv.label] = label
            }
        } else {
            val current = rowToRecord(existing)
            val nextCount = current.count + 1
            val baseAvg = current.avgValue ?: value
            val nextAvg = ((baseAvg * current.count) + value) / nextCount
            val nextMin = current.minValue?.let { min(it, value) } ?: value
            val nextMax = current.maxValue?.let { max(it, value) } ?: value
            Metrics1mKv.update({
                (Metrics1mKv.transformerId eq transformerId.toString()) and
                    (Metrics1mKv.key eq key) and
                    (Metrics1mKv.bucketTs eq bucketTs)
            }) { row ->
                row[avgValue] = nextAvg
                row[minValue] = nextMin
                row[maxValue] = nextMax
                row[count] = nextCount
                if (unit != null) {
                    row[Metrics1mKv.unit] = unit
                }
                if (label != null) {
                    row[Metrics1mKv.label] = label
                }
            }
        }

        Metrics1mKv
            .selectAll()
            .where {
                (Metrics1mKv.transformerId eq transformerId.toString()) and
                    (Metrics1mKv.key eq key) and
                    (Metrics1mKv.bucketTs eq bucketTs)
            }
            .first()
            .let(::rowToRecord)
    }
}
