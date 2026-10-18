package com.example.features.IOT.metrics.route

import com.example.core.model.user.Role.UserRole
import com.example.features.auth.common.AuthRepository
import com.example.features.IOT.metrics.data.MetricsRepository
import com.example.features.IOT.metrics.domain.metricTimestamp
import com.example.features.IOT.metrics.domain.DTO.request.MetricIngestRequest
import com.example.features.IOT.transformer.data.TransformerRepository
import com.example.plugins.Security.JwtService
import com.example.plugins.StatusPage.exception.ApiError
import io.ktor.server.application.log
import io.ktor.server.routing.Route
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.*
import org.koin.ktor.ext.inject
import java.util.UUID

private val metricsJson = Json { ignoreUnknownKeys = true }

fun Route.metricsWsRoute() {
    val metricsRepo: MetricsRepository by inject()
    val transformerRepo: TransformerRepository by inject()
    val authRepo: AuthRepository by inject()
    val jwtService: JwtService by inject()

    webSocket("/ws/transformers/{transformerId}/metrics") {
        val transformerId = runCatching { UUID.fromString(call.parameters["transformerId"]) }.getOrNull()
        if (transformerId == null) {
            close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Invalid transformer id"))
            return@webSocket
        }
        var queue: kotlinx.coroutines.channels.Channel<String>? = null
        var writer: Job? = null
        var authorizationCheck: Job? = null
        try {
            // Headers for devices, first-frame authentication for browsers.
            // Query tokens remain supported for existing device clients.
            val token = call.request.headers["Authorization"]?.removePrefix("Bearer ")
                ?: call.request.queryParameters["token"]
                ?: withTimeoutOrNull(5000) {
                    val frame = incoming.receive() as? Frame.Text ?: return@withTimeoutOrNull null
                    runCatching {
                        metricsJson.parseToJsonElement(frame.readText()).jsonObject["token"]?.jsonPrimitive?.content
                    }.getOrNull()
                }
            val decoded = runCatching { jwtService.verifier().verify(token.orEmpty()) }.getOrNull()
            val userId = runCatching { UUID.fromString(decoded?.subject) }.getOrNull()
            if (userId == null || decoded?.getClaim("type")?.asString() != "access" || decoded.expiresAt == null) {
                close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Unauthorized"))
                return@webSocket
            }
            suspend fun allowed(): Boolean {
                if (decoded.expiresAt.time <= System.currentTimeMillis()) return false
                val user = authRepo.findById(userId) ?: return false
                val transformer = transformerRepo.findById(transformerId) ?: return false
                return user.role == UserRole.ADMIN || transformer.userId == user.id
            }
            if (!allowed()) {
                close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Forbidden"))
                return@webSocket
            }
            val outgoingQueue = MetricsWsHub.add(transformerId)
            queue = outgoingQueue
            writer = launch {
                try {
                    for (payload in outgoingQueue) withTimeout(5000) { send(payload) }
                } catch (_: TimeoutCancellationException) {
                    // Close the socket as well as its writer when the client stops reading.
                }
                close(CloseReason(CloseReason.Codes.TRY_AGAIN_LATER, "Slow consumer; reconnect"))
            }
            authorizationCheck = launch {
                while (isActive) {
                    delay(minOf(30000L, (decoded.expiresAt.time - System.currentTimeMillis()).coerceAtLeast(1)))
                    if (!allowed()) {
                        close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Session expired or access revoked"))
                        break
                    }
                }
            }
            send("""{"type":"ready"}""")
            for (frame in incoming) {
                if (frame !is Frame.Text) continue
                if (!allowed()) {
                    close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Session expired or access revoked"))
                    break
                }
                try {
                    val request = metricsJson.decodeFromString<MetricIngestRequest>(frame.readText())
                    val timestamp = metricTimestamp(request.timestamp)
                    val record = metricsRepo.upsertValue(
                        transformerId, request.key.trim(), timestamp.withSecond(0).withNano(0),
                        request.value, request.unit, request.label, timestamp
                    )
                    MetricsWsHub.broadcast(transformerId, metricsJson.encodeToString(record.toResponse()))
                } catch (_: SerializationException) {
                    send("""{"type":"error","message":"Invalid metric JSON"}""")
                } catch (e: ApiError) {
                    send(buildJsonObject { put("type", "error"); put("message", e.message) }.toString())
                }
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            call.application.log.error("Metrics WebSocket failed for {}", transformerId, e)
            close(CloseReason(CloseReason.Codes.INTERNAL_ERROR, "Connection failed; reconnect"))
        } finally {
            queue?.let { MetricsWsHub.remove(transformerId, it) }
            writer?.cancel()
            authorizationCheck?.cancel()
        }
    }
}
