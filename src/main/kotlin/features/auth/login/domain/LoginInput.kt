package com.example.features.auth.login.domain

data class LoginInput(
    val email: String,
    val rawPassword: String
)
