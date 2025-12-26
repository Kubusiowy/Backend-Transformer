package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp


object DevicesTable : Table("devices") {
    val id = char("id", 36)
    val transformerId = char("transformer_id", 36)
        .references(TransformersTable.id, onDelete = ReferenceOption.CASCADE)
    val name = varchar("name", 120)
    val deviceModel = varchar("device_model", 60).nullable()
    val modbusUnitId = integer("modbus_unit_id").nullable()
    val isActive = bool("is_active").default(true)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex("uq_devices_transformer_name", transformerId, name)
        index("idx_devices_transformer", false, transformerId)
    }
}
