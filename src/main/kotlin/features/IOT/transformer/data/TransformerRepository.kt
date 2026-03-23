package com.example.features.IOT.transformer.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.Transformers
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
        Transformers.update({ Transformers.id eq id.toString() }) { row ->
            row[Transformers.name] = name
            row[Transformers.location] = location
        } > 0
    }

    suspend fun delete(id: UUID): Boolean = dbQuery {
        Transformers.deleteWhere { Transformers.id eq id.toString() } > 0
    }

    suspend fun deleteByUser(userId: UUID): Int = dbQuery {
        Transformers.deleteWhere { Transformers.userId eq userId.toString() }
    }
}
