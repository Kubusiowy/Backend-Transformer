package com.example.features.IOT.transformer.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.Transformers
import com.example.core.db.exposedTables.Meter
import com.example.core.db.exposedTables.MeterRegister
import com.example.core.db.exposedTables.Metrics1mKv
import com.example.core.db.exposedTables.MetricSamples
import com.example.core.db.exposedTables.TransformerErrors
import com.example.core.db.exposedTables.DeviceApiKeys
import com.example.core.db.exposedTables.Users
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import com.example.plugins.StatusPage.errors.BadRequest
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update
import java.time.Instant
import java.util.UUID

class TransformerRepository {

    data class TransformerRecord(
        val id: UUID,
        val userId: UUID,
        val name: String,
        val location: String?,
    )

    private fun rowToRecord(row: ResultRow): TransformerRecord = TransformerRecord(
        id = UUID.fromString(row[Transformers.id]),
        userId = UUID.fromString(row[Transformers.userId]),
        name = row[Transformers.name],
        location = row[Transformers.location],
    )

    suspend fun listAll(): List<TransformerRecord> = dbQuery {
        Transformers.selectAll().map(::rowToRecord)
    }

    suspend fun listByUser(userId: UUID): List<TransformerRecord> = dbQuery {
        Transformers.selectAll().where { Transformers.userId eq userId.toString() }.map(::rowToRecord)
    }

    suspend fun findById(id: UUID): TransformerRecord? = dbQuery {
        Transformers.selectAll().where { Transformers.id eq id.toString() }.firstOrNull()?.let(::rowToRecord)
    }

    suspend fun create(userId: UUID, name: String, location: String?): TransformerRecord = dbQuery {
        validateTransformer(name, location)
        Users.selectAll().where { Users.id eq userId.toString() }.forUpdate().firstOrNull()
            ?: throw com.example.plugins.StatusPage.errors.NotFound("User not found")
        val id = UUID.randomUUID()
        val now = Instant.now()
        Transformers.insert { row ->
            row[Transformers.id] = id.toString()
            row[Transformers.userId] = userId.toString()
            row[Transformers.name] = name
            row[Transformers.location] = location
            row[Transformers.createdAt] = now
        }
        TransformerRecord(id, userId, name, location)
    }

    suspend fun update(id: UUID, name: String, location: String?): Boolean = dbQuery {
        validateTransformer(name, location)
        Transformers.update({ Transformers.id eq id.toString() }) { row ->
            row[Transformers.name] = name
            row[Transformers.location] = location
        } > 0
    }

    suspend fun delete(id: UUID): Boolean = dbQuery {
        deleteTransformer(id.toString()) > 0
    }

    suspend fun deleteByUser(userId: UUID): Int = dbQuery {
        deleteUserTransformers(userId)
    }
}

private fun validateTransformer(name: String, location: String?) {
    if (name.isBlank() || name.length > 120 || (location?.length ?: 0) > 255) {
        throw BadRequest("Name must have 1–120 characters and location at most 255")
    }
}

// Called inside one transaction so deleting a parent cannot leave orphaned data.
internal fun deleteTransformer(id: String): Int {
    Transformers.selectAll().where { Transformers.id eq id }.forUpdate().firstOrNull() ?: return 0
    val meters = Meter.selectAll().where { Meter.transformerId eq id }.forUpdate().map { it[Meter.id] }
    if (meters.isNotEmpty()) MeterRegister.deleteWhere { MeterRegister.meterId inList meters }
    Meter.deleteWhere { Meter.transformerId eq id }
    Metrics1mKv.deleteWhere { Metrics1mKv.transformerId eq id }
    MetricSamples.deleteWhere { MetricSamples.transformerId eq id }
    TransformerErrors.deleteWhere { TransformerErrors.transformerId eq id }
    DeviceApiKeys.deleteWhere { DeviceApiKeys.transformerId eq id }
    return Transformers.deleteWhere { Transformers.id eq id }
}

internal fun deleteUserTransformers(userId: UUID): Int = Transformers.selectAll()
    .where { Transformers.userId eq userId.toString() }.map { it[Transformers.id] }
    .sumOf { deleteTransformer(it) }
