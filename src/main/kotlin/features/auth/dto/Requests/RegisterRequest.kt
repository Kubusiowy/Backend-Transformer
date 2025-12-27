package com.example.features.auth.dto.Requests

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val tenantName: String? = null
)
