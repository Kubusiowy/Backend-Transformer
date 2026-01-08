package com.example.features.auth.login.api.dto

import com.example.core.util.UUIDSerializer
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    @Serializable(with = UUIDSerializer::class)
    val userId: UUID,
    val role: String
)

