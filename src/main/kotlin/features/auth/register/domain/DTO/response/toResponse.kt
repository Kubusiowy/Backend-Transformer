package com.example.features.auth.register.domain.DTO.response

import com.example.core.model.user.User

fun User.toResponse(): UserResponse = UserResponse(
    id = this.id,
    email = this.email,
    role = this.role,
)