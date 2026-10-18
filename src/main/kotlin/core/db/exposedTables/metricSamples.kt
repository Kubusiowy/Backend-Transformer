package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.datetime

object MetricSamples : Table("metric_samples") {
    val transformerId = char("transformer_id", 36)
    val key = varchar("key", 64)
    val bucketTs = datetime("bucket_ts")
    val sequence = integer("sample_sequence")
    val sampledAt = long("sampled_at_ms")
    val value = double("value")
    val unit = varchar("unit", 16).nullable()
    val label = varchar("label", 64).nullable()

    override val primaryKey = PrimaryKey(transformerId, key, bucketTs, sequence)

    init {
        index("idx_samples_time", false, transformerId, key, sampledAt)
    }
}
