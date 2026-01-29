package com.example.features.IOT.meter.domain.DTO.request

import com.example.core.db.exposedTables.RegisterDataType
import com.example.core.db.exposedTables.RegisterType
import kotlinx.serialization.Serializable

@Serializable
data class RegisterCreateRequest(
    val name: String,
    val registerType: RegisterType,
    val address: Int,
    val length: Int,
    val dataType: RegisterDataType,
    val scale: Double = 1.0,
    val unit: String? = null,
    val enabled: Boolean = true,
    val orderIndex: Int = 0,
)
