package com.example.features.auth.register.domain.mapper

import com.example.features.auth.register.api.dto.RegisterRequest

fun String.capitalizeFirst(): String =
    trim().lowercase().replaceFirstChar { it.uppercase() }

fun RegisterRequest.toInput(): RegisterRequest = RegisterRequest(
    username = username.capitalizeFirst(),
    surname = surname.capitalizeFirst(),
    email = email.lowercase().trim(),
    rawPassword = rawPassword
)