package com.example.features.IOT.metrics.domain.DTO.request

import kotlinx.serialization.Serializable

@Serializable
data class MetricIngestRequest(
    val key: String,
    val value: Double,
    val timestamp: String? = null,
    val unit: String? = null,
    val label: String? = null,
)
