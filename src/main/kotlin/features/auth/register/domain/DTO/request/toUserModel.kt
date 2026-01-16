package com.example.features.auth.register.domain.DTO.request

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.User
import java.util.UUID

fun UserRequest.toUserModel(userId: UUID,passwordHash: String,): User =
    User(userId, email.trim().lowercase(), passwordHash, UserRole.USER)
