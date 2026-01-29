package com.example.features.auth.login.domain.DTO.response

import com.example.core.model.user.Role.UserRole
import com.example.core.util.UUIDSerializer
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class LoginResponse(
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    val accessToken: String,
    val refreshToken: String,
    val role: UserRole,

    )
