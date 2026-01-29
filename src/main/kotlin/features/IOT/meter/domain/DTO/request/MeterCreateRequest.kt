package com.example.features.IOT.meter.domain.DTO.request

import com.example.core.db.exposedTables.Parity
import kotlinx.serialization.Serializable

@Serializable
data class MeterCreateRequest(
    val name: String,
    val deviceCode: String,
    val enabled: Boolean = true,
    val serialPort: String,
    val baudRate: Int,
    val parity: Parity = Parity.NONE,
    val stopBits: Int = 1,
    val slaveId: Int,
    val pollIntervalMs: Int = 1000,
)
