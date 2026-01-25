package com.example.features.auth.refresh.domain.DTO.response

import kotlinx.serialization.Serializable


@Serializable
data class RefreshResponse(
    val accessToken: String,
)
