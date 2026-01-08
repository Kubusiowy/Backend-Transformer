package com.example.features.auth.login.domain.mapper

import com.example.features.auth.login.api.dto.LoginRequest

fun LoginRequest.toInput(): LoginRequest = LoginRequest(
    email = email.lowercase(),
    rawPassword = rawPassword,
)