package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.datetime

object Metrics1mKv: Table("metrics_1m_kv"){
    val transformerId = char("transformer_id",36) //pk 1
    val key = varchar("key",64) //pk 2
    val bucketTs = datetime("bucket_ts") // pk 3
    val avgValue = double("avg_value").nullable()
    val minValue = double("min_value").nullable()
    val maxValue = double("max_value").nullable()
    val count = integer("sample_count")
    val unit = varchar("unit",16).nullable()
    val label = varchar("label", 64).nullable()

    override val primaryKey = PrimaryKey(transformerId, key, bucketTs)
}