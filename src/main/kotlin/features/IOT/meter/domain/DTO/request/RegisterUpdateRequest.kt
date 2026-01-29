package com.example.features.IOT.meter.domain.DTO.request

import com.example.core.db.exposedTables.RegisterDataType
import com.example.core.db.exposedTables.RegisterType
import kotlinx.serialization.Serializable

@Serializable
data class RegisterUpdateRequest(
    val name: String? = null,
    val registerType: RegisterType? = null,
    val address: Int? = null,
    val length: Int? = null,
    val dataType: RegisterDataType? = null,
    val scale: Double? = null,
    val unit: String? = null,
    val enabled: Boolean? = null,
    val orderIndex: Int? = null,
)
