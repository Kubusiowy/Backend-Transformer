package com.example.features.auth.dto

import com.example.core.model.user.Role.Role
import java.util.UUID

data class RegisterResult(
    val tenantId: UUID,
    val userId: UUID,
    val role: Role
)