package com.example.features.IOT.metrics.domain

import com.example.plugins.StatusPage.errors.BadRequest
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneOffset

fun metricTimestamp(value: String?): LocalDateTime {
    if (value.isNullOrBlank()) return LocalDateTime.now(ZoneOffset.UTC)
    return runCatching { OffsetDateTime.parse(value).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime() }
        .recoverCatching { LocalDateTime.parse(value) }.getOrNull()
        ?: throw BadRequest("Invalid timestamp format")
}
