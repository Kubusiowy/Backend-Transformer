package com.example.features.auth.login.domain.DTO.request

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val rawPassword: String
)



