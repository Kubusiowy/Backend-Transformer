package com.example.core.model.transformer

import java.util.UUID

data class Transformer(
    val id: UUID,
    val userId: UUID,
    val name: String,
    val location: String
)
