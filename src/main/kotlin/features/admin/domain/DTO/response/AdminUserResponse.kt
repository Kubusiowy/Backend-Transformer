package com.example.features.admin.domain.DTO.response

import com.example.core.model.user.Role.UserRole
import com.example.core.util.UUIDSerializer
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class AdminUserResponse(
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    val email: String,
    val role: UserRole,
)
