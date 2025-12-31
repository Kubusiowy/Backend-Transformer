package com.example.features.auth.mapper


import com.example.features.auth.dto.Requests.RegisterInput
import com.example.features.auth.dto.Requests.RegisterRequest


fun RegisterRequest.toInput() = RegisterInput(
    email = email.trim().lowercase(),
    rawPassword = password,
    name = surname.trim().lowercase(),
    surname = surname.trim().lowercase(),
)


