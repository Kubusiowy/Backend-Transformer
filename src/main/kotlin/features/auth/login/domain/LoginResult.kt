package com.example.features.auth.login.domain

import com.example.core.model.user.Role.Role
import com.example.core.util.UUIDSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
sealed class LoginResult {
    @Serializable
    @SerialName("success")
    data class Success(
        val accessToken: String,
        @Serializable(with = UUIDSerializer::class)
        val userId: UUID,
        val role: Role
    ) : LoginResult()

    @Serializable
    @SerialName("failure")
    data class Failure(val error: String) : LoginResult()
}
