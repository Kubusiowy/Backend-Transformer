package com.example.features.auth.register.domain


import com.example.core.util.UUIDSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
sealed class RegisterResult {
    @Serializable @SerialName("success")
    data class Success(
        @Serializable(with = UUIDSerializer::class)
        val userId: UUID
    ) :RegisterResult()
    @Serializable @SerialName("failure")
    data class Failure(val error: String) : RegisterResult()

}