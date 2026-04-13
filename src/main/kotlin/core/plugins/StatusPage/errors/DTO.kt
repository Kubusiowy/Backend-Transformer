package com.example.core.plugins.StatusPage.errors

import kotlinx.serialization.Serializable

@Serializable
data class ErrorResponse(
    val message: String,
    val code: Int,
    val path: String
)

