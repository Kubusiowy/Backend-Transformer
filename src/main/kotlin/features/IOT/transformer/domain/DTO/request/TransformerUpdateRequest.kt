package com.example.features.IOT.transformer.domain.DTO.request

import kotlinx.serialization.Serializable

@Serializable
data class TransformerUpdateRequest(
    val name: String? = null,
    val location: String? = null,
)
