package com.example.features.auth.dto.Responses

import com.example.core.model.user.Role.Role
import com.example.util.UUIDSerializer
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class UserResponse (
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    val email: String,
    @Serializable(with = UUIDSerializer::class)
    val tenantId: UUID,
    val role: Role,
)
