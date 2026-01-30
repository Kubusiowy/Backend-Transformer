package com.example.features.IOT.transformer.domain.DTO.response

import com.example.core.db.exposedTables.TransformerErrorStatus
import kotlinx.serialization.Serializable

@Serializable
data class TransformerErrorResponse(
    val id: Long,
    val transformerId: String,
    val code: String,
    val message: String,
    val status: TransformerErrorStatus,
    val createdAt: String,
)
