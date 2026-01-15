package com.example.features.auth.register.domain.DTO.request

import com.example.core.model.user.User
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class UserRequest(
    val email:String,
    val rawPassword: String
)

fun UserRequest.toUserModel(userId: UUID,passwordHash: String): User =
    User(userId, email, passwordHash)
