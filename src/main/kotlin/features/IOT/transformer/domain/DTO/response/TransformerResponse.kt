package com.example.features.IOT.transformer.domain.DTO.response

import com.example.core.util.UUIDSerializer
import kotlinx.serialization.Serializable
import java.util.UUID
@Serializable
data class TransformerResponse (
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    val name: String
    )