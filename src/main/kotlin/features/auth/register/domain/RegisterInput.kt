package com.example.features.auth.register.domain

data class RegisterInput(
    val username: String,
    val surname: String,
    val email: String,
    val rawPassword: String
)