package com.example.core.db.exposedTables

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.CurrentTimestamp
import org.jetbrains.exposed.sql.javatime.timestamp

@Serializable
enum class Parity {
    NONE,
    EVEN,
    ODD
}

@Serializable
enum class ByteOrder {
    BIG_ENDIAN,
    LITTLE_ENDIAN
}

object Meter : Table("meter") {
    val id = long("id").autoIncrement()
    val transformerId = char("transformer_id", 36).index("idx_meter_transformer_id")
    val name = varchar("name", 64)
    val deviceCode = varchar("device_code", 64).uniqueIndex("device_code")
    val enabled = bool("enabled").default(true)
    val serialPort = varchar("serial_port", 64)
    val baudRate = integer("baud_rate")
    val dataBits = integer("data_bits").default(8)
    val parity = enumerationByName("parity", 8, Parity::class).default(Parity.NONE)
    val stopBits = integer("stop_bits").default(1)
    val slaveId = integer("slave_id")
    val byteOrder = enumerationByName("byte_order", 16, ByteOrder::class).default(ByteOrder.BIG_ENDIAN)
    val pollIntervalMs = integer("poll_interval_ms").default(1000)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp)
    val updatedAt = timestamp("updated_at").defaultExpression(CurrentTimestamp)

    override val primaryKey = PrimaryKey(id)
}
