package com.example.features.auth.login.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val rawPassword: String
)

