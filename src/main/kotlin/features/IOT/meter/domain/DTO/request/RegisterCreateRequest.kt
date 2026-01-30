package com.example.features.IOT.meter.domain.DTO.request

import com.example.core.db.exposedTables.RegisterDataType
import com.example.core.db.exposedTables.RegisterType
import kotlinx.serialization.Serializable

@Serializable
data class RegisterCreateRequest(
    val name: String,
    val address: Int,
    val dataType: RegisterDataType,
    val registerType: RegisterType? = null,
    val length: Int? = null,
    val scale: Double = 1.0,
    val unit: String? = null,
    val enabled: Boolean = true,
    val orderIndex: Int = 0,
)
