package com.example.features.IOT.meter.domain.DTO.response

import com.example.core.db.exposedTables.Parity
import com.example.core.util.UUIDSerializer
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class MeterResponse(
    val id: Long,
    @Serializable(with = UUIDSerializer::class)
    val transformerId: UUID,
    val name: String,
    val deviceCode: String,
    val enabled: Boolean,
    val serialPort: String,
    val baudRate: Int,
    val parity: Parity,
    val stopBits: Int,
    val slaveId: Int,
    val pollIntervalMs: Int,
)
