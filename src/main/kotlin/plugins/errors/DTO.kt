package com.example.plugins.errors

import kotlinx.serialization.Serializable

@Serializable
data class ErrorResponse(
    val isSuccess: Boolean,
    val message: String,
    val code: Int,
    val path: String,
)
