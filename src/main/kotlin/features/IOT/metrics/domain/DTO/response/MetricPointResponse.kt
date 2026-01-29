package com.example.features.IOT.metrics.domain.DTO.response

import kotlinx.serialization.Serializable

@Serializable
data class MetricPointResponse(
    val transformerId: String,
    val key: String,
    val bucketTs: String,
    val avgValue: Double?,
    val minValue: Double?,
    val maxValue: Double?,
    val count: Int,
    val unit: String? = null,
    val label: String? = null,
)
