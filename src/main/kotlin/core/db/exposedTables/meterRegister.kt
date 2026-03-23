package com.example.core.db.exposedTables

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.CurrentTimestamp
import org.jetbrains.exposed.sql.javatime.timestamp

@Serializable
enum class RegisterType {
    INPUT,
    HOLDING
}

@Serializable
enum class RegisterDataType {
    INT16,
    INT32,
    FLOAT32
}

object MeterRegister : Table("meter_register") {
    val id = long("id").autoIncrement()
    val meterId = long("meter_id").index("idx_register_meter_id")
    val name = varchar("name", 64)
    val registerType = enumerationByName("register_type", 16, RegisterType::class)
    val address = integer("address")
    val length = integer("length")
    val dataType = enumerationByName("data_type", 16, RegisterDataType::class)
    val scale = double("scale").default(1.0)
    val unit = varchar("unit", 16).nullable()
    val enabled = bool("enabled").default(true)
    val orderIndex = integer("order_index").default(0)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp)

    override val primaryKey = PrimaryKey(id)
}
