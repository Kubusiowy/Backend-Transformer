package com.example.features.auth.register.domain.DTO.response

import com.example.core.model.user.User

fun User.toResponse(): RegisterResponse = RegisterResponse(
    id = this.id,
    email = this.email,
    role = this.role,
)