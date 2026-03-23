package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.CurrentTimestamp
import org.jetbrains.exposed.sql.javatime.timestamp

object DeviceApiKeys : Table("device_api_keys") {
    val id = char("id",36)
    val transformerId = char("transformer_id", 36)
        .index("idx_api_keys_transformer_id")

    val apiKey = char("api_key",64).uniqueIndex("api_key")
    val isActive = bool("is_active").default(true)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp)

    override val primaryKey = PrimaryKey(id)
}
