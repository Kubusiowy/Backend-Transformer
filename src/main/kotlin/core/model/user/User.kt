package com.example.core.model.user

import com.example.core.model.user.Role.Role
import java.util.UUID

data class User(
    val id: UUID,
    val tenantId: UUID,
    val email: String,
    val role: Role = Role.USER,
)