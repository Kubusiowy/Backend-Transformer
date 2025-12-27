package com.example.features.auth.dto.Responses

import kotlinx.serialization.Serializable

@Serializable
data class RegisterResponse(
    val token: String,
    val user: UserResponse
)
