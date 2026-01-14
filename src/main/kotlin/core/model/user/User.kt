package com.example.core.model.user

import com.example.core.model.user.Role.UserRole

data class User(
    val id: String,
    val email:String,
    val passwordHash:String,
    val role: UserRole = UserRole.USER,
)
