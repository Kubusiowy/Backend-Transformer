package com.example.features.auth.dto.Requests

import com.example.core.model.user.Role.Role
import com.example.util.UUIDSerializer
import kotlinx.serialization.serializer
import java.util.UUID



data class UserRequest(
    val email: String,
    val password: String,
    val tenantId: UUID,
    val role: Role = Role.USER
)