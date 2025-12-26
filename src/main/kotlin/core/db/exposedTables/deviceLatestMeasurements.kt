package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp


object DeviceLatestMeasurementsTable : Table("device_latest_measurements") {
    val deviceId = char("device_id", 36)
        .references(DevicesTable.id, onDelete = ReferenceOption.CASCADE)
    val metricKey = varchar("metric_key", 80)
    val value = decimal("value", 16, 6)
    val unit = varchar("unit", 20).nullable()
    val takenAt = timestamp("taken_at")

    override val primaryKey = PrimaryKey(deviceId, metricKey)

    init {
        index("idx_latest_taken_at", false, takenAt)
    }
}
