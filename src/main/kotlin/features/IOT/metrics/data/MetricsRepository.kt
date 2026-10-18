package com.example.features.IOT.metrics.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.Metrics1mKv
import com.example.core.db.exposedTables.MetricSamples
import com.example.core.db.exposedTables.Transformers
import com.example.plugins.StatusPage.errors.BadRequest
import com.example.plugins.StatusPage.errors.NotFound
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.less
import org.jetbrains.exposed.sql.SqlExpressionBuilder.notInSubQuery
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID
import kotlin.math.max
import kotlin.math.min

class MetricsRepository {

    data class MetricRecord(
        val transformerId: UUID,
        val key: String,
        val bucketTs: LocalDateTime,
        val lastValue: Double?,
        val avgValue: Double?,
        val minValue: Double?,
        val maxValue: Double?,
        val count: Int,
        val unit: String?,
        val label: String?,
        val sampleId: String? = null,
        val timestamp: LocalDateTime? = null,
    )

    private fun rowToRecord(row: ResultRow) = MetricRecord(
        transformerId = UUID.fromString(row[Metrics1mKv.transformerId]),
        key = row[Metrics1mKv.key],
        bucketTs = row[Metrics1mKv.bucketTs],
        lastValue = row[Metrics1mKv.lastValue],
        avgValue = row[Metrics1mKv.avgValue],
        minValue = row[Metrics1mKv.minValue],
        maxValue = row[Metrics1mKv.maxValue],
        count = row[Metrics1mKv.count],
        unit = row[Metrics1mKv.unit],
        label = row[Metrics1mKv.label],
    )

    suspend fun listKeys(transformerId: UUID): List<String> = dbQuery {
        Metrics1mKv
            .select(Metrics1mKv.key)
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
        samples: Boolean = false,
        before: LocalDateTime? = null,
        beforeSequence: Int = 0,
    ): List<MetricRecord> = dbQuery {
        val sampleKey = (MetricSamples.transformerId eq transformerId.toString()) and (MetricSamples.key eq key)
        var condition: Op<Boolean> = Metrics1mKv.transformerId eq transformerId.toString()
        condition = condition and (Metrics1mKv.key eq key)
        if (from != null) {
            condition = condition and (Metrics1mKv.bucketTs greaterEq from)
        }
        if (to != null) {
            condition = condition and (Metrics1mKv.bucketTs lessEq to)
        }
        if (before != null) condition = condition and (Metrics1mKv.bucketTs less before)
        // Exclude sampled minutes before limiting, so legacy history cannot be hidden between pages.
        if (samples) condition = condition and (Metrics1mKv.bucketTs notInSubQuery
            MetricSamples.select(MetricSamples.bucketTs).where { sampleKey })
        val aggregates = Metrics1mKv
            .selectAll()
            .where { condition }
            .orderBy(Metrics1mKv.bucketTs to if (orderAsc) SortOrder.ASC else SortOrder.DESC)
            .limit(limit)
            .map(::rowToRecord)
        if (!samples) return@dbQuery aggregates

        var sampleCondition = sampleKey
        if (from != null) sampleCondition = sampleCondition and (MetricSamples.sampledAt greaterEq from.toInstant(ZoneOffset.UTC).toEpochMilli())
        if (to != null) sampleCondition = sampleCondition and (MetricSamples.sampledAt lessEq to.toInstant(ZoneOffset.UTC).toEpochMilli())
        if (before != null) {
            val beforeMillis = before.toInstant(ZoneOffset.UTC).toEpochMilli()
            sampleCondition = sampleCondition and ((MetricSamples.sampledAt less beforeMillis) or
                ((MetricSamples.sampledAt eq beforeMillis) and (MetricSamples.sequence less beforeSequence)))
        }
        val order = if (orderAsc) SortOrder.ASC else SortOrder.DESC
        val readings = MetricSamples.selectAll().where { sampleCondition }
            .orderBy(MetricSamples.sampledAt to order, MetricSamples.sequence to order).limit(limit).map { row ->
                val value = row[MetricSamples.value]
                val bucket = row[MetricSamples.bucketTs]
                MetricRecord(transformerId, key, bucket, value, value, value, value, 1,
                    row[MetricSamples.unit], row[MetricSamples.label],
                    "$bucket#${row[MetricSamples.sequence]}",
                    LocalDateTime.ofInstant(Instant.ofEpochMilli(row[MetricSamples.sampledAt]), ZoneOffset.UTC))
            }
        val history = (readings + aggregates)
            .sortedWith(compareBy<MetricRecord> { it.timestamp ?: it.bucketTs }
                .thenBy { it.sampleId?.substringAfterLast('#')?.toIntOrNull() ?: 0 })
        (if (orderAsc) history else history.reversed()).take(limit)
    }

    suspend fun upsertValue(
        transformerId: UUID,
        key: String,
        bucketTs: LocalDateTime,
        value: Double,
        unit: String?,
        label: String?,
        timestamp: LocalDateTime = bucketTs,
    ): MetricRecord = dbQuery {
        if (key.isBlank() || key.length > 64 || !value.isFinite() ||
            (unit?.length ?: 0) > 16 || (label?.length ?: 0) > 64 || bucketTs.year !in 1000..9999 ||
            timestamp.withSecond(0).withNano(0) != bucketTs) {
            throw BadRequest("Invalid metric: key/label max 64, unit max 16, value must be finite")
        }
        // Lock an existing parent, including for the very first sample in a bucket.
        // This also serializes writes against deletion across server instances.
        Transformers.selectAll().where { Transformers.id eq transformerId.toString() }
            .forUpdate().firstOrNull() ?: throw NotFound("Transformer not found")
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
                row[Metrics1mKv.lastValue] = value
                row[Metrics1mKv.avgValue] = value
                row[Metrics1mKv.minValue] = value
                row[Metrics1mKv.maxValue] = value
                row[Metrics1mKv.count] = 1
                row[Metrics1mKv.unit] = unit
                row[Metrics1mKv.label] = label
            }
        } else {
            val current = rowToRecord(existing)
            if (current.count == Int.MAX_VALUE) throw BadRequest("Sample count limit reached")
            val nextCount = current.count + 1
            val baseAvg = current.avgValue ?: value
            val nextAvg = baseAvg * (current.count.toDouble() / nextCount) + value / nextCount
            val nextMin = current.minValue?.let { min(it, value) } ?: value
            val nextMax = current.maxValue?.let { max(it, value) } ?: value
            Metrics1mKv.update({
                (Metrics1mKv.transformerId eq transformerId.toString()) and
                    (Metrics1mKv.key eq key) and
                    (Metrics1mKv.bucketTs eq bucketTs)
            }) { row ->
                row[lastValue] = value
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

        val record = Metrics1mKv
            .selectAll()
            .where {
                (Metrics1mKv.transformerId eq transformerId.toString()) and
                    (Metrics1mKv.key eq key) and
                    (Metrics1mKv.bucketTs eq bucketTs)
            }
            .first()
            .let(::rowToRecord)
        val sampledAt = timestamp.toInstant(ZoneOffset.UTC).toEpochMilli()
        MetricSamples.insert { row ->
            row[MetricSamples.transformerId] = transformerId.toString()
            row[MetricSamples.key] = key
            row[MetricSamples.bucketTs] = bucketTs
            row[MetricSamples.sequence] = record.count
            row[MetricSamples.sampledAt] = sampledAt
            row[MetricSamples.value] = value
            row[MetricSamples.unit] = unit
            row[MetricSamples.label] = label
        }
        record.copy(sampleId = "$bucketTs#${record.count}",
            timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(sampledAt), ZoneOffset.UTC))
    }
}
