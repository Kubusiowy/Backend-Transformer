package com.example.core.model.user

import com.example.core.model.user.Role.Role
import java.time.Instant
import java.util.UUID

data class User(
    val id:UUID,
    val tenantId:UUID,
    val email:String,
    val passwordHash:String,
    val role: Role,
    val isActive: Boolean,
    val createdAt: Instant
)

