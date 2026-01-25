package com.example.features.auth.refresh.domain.DTO.request

import kotlinx.serialization.Serializable

@Serializable
data class RefreshRequest(
    val refreshToken: String,
)
