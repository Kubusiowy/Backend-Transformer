package com.example.core.db.exposedTables

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

@Serializable
enum class TransformerErrorStatus {
    INFO,
    WARNING,
    ERROR
}

object TransformerErrors : Table("transformer_errors") {
    val id = long("id").autoIncrement()
    val transformerId = char("transformer_id", 36).index("idx_transformer_errors_transformer_id")
    val code = varchar("code", 64)
    val message = varchar("message", 255)
    val status = enumerationByName("status", 16, TransformerErrorStatus::class)
        .default(TransformerErrorStatus.ERROR)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}
