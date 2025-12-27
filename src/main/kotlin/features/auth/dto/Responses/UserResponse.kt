package com.example.features.auth.dto.Responses

import com.example.core.model.user.Role.Role
import java.util.UUID

data class UserResponse (
    val id: UUID,
    val email: String,
    val tenantId: UUID,
    val role: Role,
)