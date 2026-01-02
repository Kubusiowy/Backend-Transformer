package com.example.features.auth.register.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(
    val username:String,
    val surname:String,
    val email:String,
    val rawPassword: String
)