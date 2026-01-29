package com.example.features.IOT.meter.domain.DTO.response

import com.example.core.db.exposedTables.RegisterDataType
import com.example.core.db.exposedTables.RegisterType
import kotlinx.serialization.Serializable

@Serializable
data class RegisterResponse(
    val id: Long,
    val meterId: Long,
    val name: String,
    val registerType: RegisterType,
    val address: Int,
    val length: Int,
    val dataType: RegisterDataType,
    val scale: Double,
    val unit: String? = null,
    val enabled: Boolean,
    val orderIndex: Int,
)
