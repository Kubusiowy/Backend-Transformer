package com.example.features.IOT.meter.domain.DTO.request

import com.example.core.db.exposedTables.Parity
import kotlinx.serialization.Serializable

@Serializable
data class MeterUpdateRequest(
    val name: String? = null,
    val deviceCode: String? = null,
    val enabled: Boolean? = null,
    val serialPort: String? = null,
    val baudRate: Int? = null,
    val parity: Parity? = null,
    val stopBits: Int? = null,
    val slaveId: Int? = null,
    val pollIntervalMs: Int? = null,
)
