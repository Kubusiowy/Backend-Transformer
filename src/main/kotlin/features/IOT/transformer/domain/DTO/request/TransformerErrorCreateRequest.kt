package com.example.features.IOT.transformer.domain.DTO.request

import com.example.core.db.exposedTables.TransformerErrorStatus
import kotlinx.serialization.Serializable

@Serializable
data class TransformerErrorCreateRequest(
    val code: String,
    val message: String,
    val status: TransformerErrorStatus = TransformerErrorStatus.ERROR,
)
