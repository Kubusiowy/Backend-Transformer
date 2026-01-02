package com.example.features.auth.register.domain.mapper

import com.example.features.auth.register.api.dto.RegisterRequest
import com.example.features.auth.register.domain.RegisterInput

fun String.capitalizeFirst(): String =
    trim().lowercase().replaceFirstChar { it.uppercase() }

fun RegisterRequest.toInput(): RegisterInput = RegisterInput(
    username = username.capitalizeFirst(),
    surname = surname.capitalizeFirst(),
    email = email.lowercase().trim(),
    rawPassword = rawPassword
)