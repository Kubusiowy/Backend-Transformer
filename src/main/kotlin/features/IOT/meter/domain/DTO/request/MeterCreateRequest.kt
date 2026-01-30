package com.example.features.IOT.meter.domain.DTO.request

import com.example.core.db.exposedTables.ByteOrder
import com.example.core.db.exposedTables.Parity
import kotlinx.serialization.Serializable

@Serializable
data class MeterCreateRequest(
    val name: String,
    val deviceCode: String,
    val enabled: Boolean = true,
    val serialPort: String,
    val baudRate: Int,
    val dataBits: Int = 8,
    val parity: Parity = Parity.NONE,
    val stopBits: Int = 1,
    val slaveId: Int,
    val byteOrder: ByteOrder = ByteOrder.BIG_ENDIAN,
    val pollIntervalMs: Int = 1000,
)
