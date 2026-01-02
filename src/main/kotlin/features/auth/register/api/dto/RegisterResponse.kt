package com.example.features.auth.register.api.dto

import com.example.core.util.UUIDSerializer
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class RegisterResponse(
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    val name:String,
    val surname:String,
    val email: String,
    val role:String
)