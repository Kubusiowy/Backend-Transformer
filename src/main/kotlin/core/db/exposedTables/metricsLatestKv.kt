package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object MetricsLatestKv : Table("metrics_latest_kv") {
    val transformerId = char("transformer_id", 36) // pk 1
    val key = varchar("key", 64) // pk2
    val value = double("value").nullable()
    val unit = varchar("unit",16).nullable()
    val label = varchar("label", 64).nullable()
    val updateAt = timestamp("update_at")
}