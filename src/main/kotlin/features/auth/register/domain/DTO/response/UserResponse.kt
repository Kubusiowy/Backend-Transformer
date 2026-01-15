package com.example.features.auth.register.domain.DTO.response

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.User
import com.example.core.util.UUIDSerializer
import kotlinx.serialization.Serializable
import java.util.UUID


@Serializable
data class UserResponse(
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    val email: String,
    val role: UserRole,
)

fun User.toResponse(): UserResponse = UserResponse(
    id = this.id,
    email = this.email,
    role = this.role,
)