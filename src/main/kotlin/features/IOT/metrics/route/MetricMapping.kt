package com.example.features.IOT.metrics.route

import com.example.features.IOT.metrics.data.MetricsRepository
import com.example.features.IOT.metrics.domain.DTO.response.MetricPointResponse

internal fun MetricsRepository.MetricRecord.toResponse() = MetricPointResponse(
    transformerId.toString(), key, bucketTs.toString() + "Z", lastValue, avgValue, minValue, maxValue, count, unit, label,
    sampleId, timestamp?.let { it.toString() + "Z" }
)
