package com.example.features.admin.domain.DTO.request

import kotlinx.serialization.Serializable

@Serializable
data class ChangePasswordRequest(
    val newPassword: String,
)
