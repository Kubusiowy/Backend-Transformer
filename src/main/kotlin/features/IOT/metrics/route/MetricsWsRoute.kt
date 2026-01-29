package com.example.features.IOT.metrics.route

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.jwt.UserPrincipal
import com.example.features.IOT.metrics.data.MetricsRepository
import com.example.features.IOT.metrics.domain.DTO.request.MetricIngestRequest
import com.example.features.IOT.metrics.domain.DTO.response.MetricPointResponse
import com.example.features.IOT.transformer.data.TransformerRepository
import com.example.plugins.Security.JwtService
import io.ktor.server.routing.Route
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.Frame
import io.ktor.websocket.CloseReason
import io.ktor.websocket.close
import io.ktor.websocket.readText
import kotlinx.serialization.json.Json
import org.koin.ktor.ext.inject
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

private val metricsJson = Json {
    ignoreUnknownKeys = true
    isLenient = true
}

fun Route.metricsWsRoute() {
    val metricsRepo: MetricsRepository by inject()
    val transformerRepo: TransformerRepository by inject()
    val jwtService: JwtService by inject()

    fun parsePrincipal(token: String?): UserPrincipal? {
        if (token.isNullOrBlank()) {
            return null
        }
        val cleaned = token.removePrefix("Bearer ").trim()
        val decoded = runCatching { jwtService.verifier().verify(cleaned) }.getOrNull() ?: return null
        val subject = decoded.subject?.let { runCatching { UUID.fromString(it) }.getOrNull() } ?: return null
        val roleValue = decoded.getClaim("role")?.asString()?.uppercase() ?: return null
        val role = runCatching { UserRole.valueOf(roleValue) }.getOrNull() ?: return null
        return UserPrincipal(subject, role)
    }

    fun parseTimestamp(value: String?): LocalDateTime {
        if (value.isNullOrBlank()) {
            return LocalDateTime.now(ZoneOffset.UTC)
        }
        val offset = runCatching { OffsetDateTime.parse(value) }.getOrNull()
        if (offset != null) {
            return offset.withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime()
        }
        return runCatching { LocalDateTime.parse(value) }.getOrElse { LocalDateTime.now(ZoneOffset.UTC) }
    }

    webSocket("/ws/transformers/{transformerId}/metrics") {
        val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        if (transformerId == null) {
            close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Invalid transformer id"))
            return@webSocket
        }

        val token = call.request.queryParameters["token"]
            ?: call.request.headers["Authorization"]
        val principal = parsePrincipal(token)
        if (principal == null) {
            close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Unauthorized"))
            return@webSocket
        }

        val transformer = transformerRepo.findById(transformerId)
        if (transformer == null) {
            close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Transformer not found"))
            return@webSocket
        }
        if (principal.role != UserRole.ADMIN && transformer.userId != principal.subject) {
            close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Forbidden"))
            return@webSocket
        }

        MetricsWsHub.add(transformerId, this)

        try {
            for (frame in incoming) {
                if (frame !is Frame.Text) {
                    continue
                }
                val text = frame.readText()
                val request = runCatching { metricsJson.decodeFromString(MetricIngestRequest.serializer(), text) }.getOrNull()
                    ?: continue
                if (request.key.isBlank()) {
                    continue
                }

                val timestamp = parseTimestamp(request.timestamp)
                val bucketTs = timestamp.withSecond(0).withNano(0)
                val record = metricsRepo.upsertValue(
                    transformerId = transformerId,
                    key = request.key.trim(),
                    bucketTs = bucketTs,
                    value = request.value,
                    unit = request.unit,
                    label = request.label,
                )
                val payload = MetricPointResponse(
                    transformerId = record.transformerId.toString(),
                    key = record.key,
                    bucketTs = record.bucketTs.toString(),
                    avgValue = record.avgValue,
                    minValue = record.minValue,
                    maxValue = record.maxValue,
                    count = record.count,
                    unit = record.unit,
                    label = record.label,
                )
                val encoded = metricsJson.encodeToString(MetricPointResponse.serializer(), payload)
                MetricsWsHub.broadcast(transformerId, encoded)
            }
        } finally {
            MetricsWsHub.remove(transformerId, this)
        }
    }
}
