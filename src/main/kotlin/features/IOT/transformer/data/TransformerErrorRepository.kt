package com.example.features.IOT.transformer.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.TransformerErrorStatus
import com.example.core.db.exposedTables.TransformerErrors
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import java.time.Instant
import java.util.UUID

class TransformerErrorRepository {

    data class TransformerErrorRecord(
        val id: Long,
        val transformerId: UUID,
        val code: String,
        val message: String,
        val status: TransformerErrorStatus,
        val createdAt: Instant,
    )

    private fun rowToError(row: ResultRow): TransformerErrorRecord = TransformerErrorRecord(
        id = row[TransformerErrors.id],
        transformerId = UUID.fromString(row[TransformerErrors.transformerId]),
        code = row[TransformerErrors.code],
        message = row[TransformerErrors.message],
        status = row[TransformerErrors.status],
        createdAt = row[TransformerErrors.createdAt],
    )

    suspend fun listByTransformer(transformerId: UUID): List<TransformerErrorRecord> = dbQuery {
        TransformerErrors
            .selectAll()
            .where { TransformerErrors.transformerId eq transformerId.toString() }
            .orderBy(TransformerErrors.createdAt, SortOrder.DESC)
            .limit(5)
            .map(::rowToError)
    }

    suspend fun create(
        transformerId: UUID,
        code: String,
        message: String,
        status: TransformerErrorStatus,
    ): TransformerErrorRecord = dbQuery {
        val now = Instant.now()
        val newId = TransformerErrors.insert { row ->
            row[TransformerErrors.transformerId] = transformerId.toString()
            row[TransformerErrors.code] = code
            row[TransformerErrors.message] = message
            row[TransformerErrors.status] = status
            row[TransformerErrors.createdAt] = now
        } get TransformerErrors.id
        val excessIds = TransformerErrors
            .selectAll()
            .where { TransformerErrors.transformerId eq transformerId.toString() }
            .orderBy(TransformerErrors.createdAt, SortOrder.DESC)
            .limit(1000).offset(start = 5)
            .map { it[TransformerErrors.id] }
        if (excessIds.isNotEmpty()) {
            TransformerErrors.deleteWhere { TransformerErrors.id inList excessIds }
        }
        TransformerErrors.selectAll().where { TransformerErrors.id eq newId }.first().let(::rowToError)
    }
}
