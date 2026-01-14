package com.example.features.auth.register.domain.DTO.request

import kotlinx.serialization.Serializable

@Serializable
data class UserRequest(
    val email:String,
    val rawPassword: String
)
