package com.example.features.IOT.transformer.domain.DTO.request

import kotlinx.serialization.Serializable

@Serializable
data class TransformerRequest(
    val name:String,
    val location:String,
)