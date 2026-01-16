package com.example.core.model.user

import com.example.core.model.user.Role.UserRole
import java.util.UUID

data class User(
    val id: UUID,
    val email:String,
    val passwordHash:String,
    val role: UserRole
)
