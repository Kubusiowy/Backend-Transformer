package com.example.features.IOT.metrics.route

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.jwt.UserPrincipal
import com.example.features.IOT.metrics.data.MetricsRepository
import com.example.features.IOT.metrics.domain.DTO.request.MetricIngestRequest
import com.example.features.IOT.metrics.domain.DTO.response.MetricPointResponse
import com.example.features.IOT.transformer.data.TransformerRepository
import com.example.plugins.StatusPage.errors.BadRequest
import com.example.plugins.StatusPage.errors.Forbidden
import com.example.plugins.StatusPage.errors.NotFound
import com.example.plugins.StatusPage.errors.Unauthorized
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import org.koin.ktor.ext.inject
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

fun Route.metricsRoute() {
    val metricsRepo: MetricsRepository by inject()
    val transformerRepo: TransformerRepository by inject()

    fun getPrincipal(call: ApplicationCall): UserPrincipal =
        call.principal<UserPrincipal>() ?: throw Unauthorized("Unauthorized")

    suspend fun requireTransformerAccess(transformerId: UUID, principal: UserPrincipal): TransformerRepository.TransformerRecord {
        val transformer = transformerRepo.findById(transformerId) ?: throw NotFound("Transformer not found")
        if (principal.role != UserRole.ADMIN && transformer.userId != principal.subject) {
            throw Forbidden("Brak dostepu do transformatora")
        }
        return transformer
    }

    fun parseTimestamp(value: String?, field: String): LocalDateTime? {
        if (value.isNullOrBlank()) {
            return null
        }
        val offset = runCatching { OffsetDateTime.parse(value) }.getOrNull()
        if (offset != null) {
            return offset.withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime()
        }
        val local = runCatching { LocalDateTime.parse(value) }.getOrNull()
        return local ?: throw BadRequest("Invalid $field format")
    }

    route("/transformers/{transformerId}/metrics") {
        get {
            val principal = getPrincipal(call)
            val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid transformer id")
            requireTransformerAccess(transformerId, principal)

            val key = call.request.queryParameters["key"]?.trim()
            if (key.isNullOrBlank()) {
                throw BadRequest("Metric key is required")
            }

            val limit = call.request.queryParameters["limit"]?.toIntOrNull()?.coerceIn(1, 5000) ?: 300
            val from = parseTimestamp(call.request.queryParameters["from"], "from")
            val to = parseTimestamp(call.request.queryParameters["to"], "to")
            if (from != null && to != null && from > to) throw BadRequest("from must not be after to")
            val order = call.request.queryParameters["order"]?.lowercase()
            val orderAsc = order != "desc"
            val before = parseTimestamp(call.request.queryParameters["before"], "before")
            val beforeSequence = call.request.queryParameters["beforeSequence"]?.let {
                it.toIntOrNull()?.takeIf { value -> value >= 0 }
                    ?: throw BadRequest("Invalid beforeSequence")
            } ?: 0
            if (before != null && orderAsc) throw BadRequest("before requires order=desc")
            if (before == null && call.request.queryParameters["beforeSequence"] != null) {
                throw BadRequest("beforeSequence requires before")
            }

            val resolution = call.request.queryParameters["resolution"] ?: "minute"
            if (resolution !in listOf("minute", "samples")) throw BadRequest("Invalid resolution")
            val points = metricsRepo.list(transformerId, key, limit, from, to, orderAsc,
                samples = resolution == "samples", before = before, beforeSequence = beforeSequence)
            call.respond(HttpStatusCode.OK, points.map { it.toResponse() })
        }

        post {
            val principal = getPrincipal(call)
            val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid transformer id")
            requireTransformerAccess(transformerId, principal)

            val req = call.receive<MetricIngestRequest>()
            if (req.key.isBlank()) {
                throw BadRequest("Metric key is required")
            }

            val timestamp = parseTimestamp(req.timestamp, "timestamp") ?: LocalDateTime.now(ZoneOffset.UTC)
            val bucketTs = timestamp.withSecond(0).withNano(0)
            val record = metricsRepo.upsertValue(
                transformerId = transformerId,
                key = req.key.trim(),
                bucketTs = bucketTs,
                value = req.value,
                unit = req.unit,
                label = req.label,
                timestamp = timestamp,
            )
            val response = record.toResponse()
            MetricsWsHub.broadcast(transformerId, kotlinx.serialization.json.Json.encodeToString(MetricPointResponse.serializer(), response))
            call.respond(HttpStatusCode.Created, response)
        }
    }

    get("/transformers/{transformerId}/metrics/keys") {
        val principal = getPrincipal(call)
        val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: throw BadRequest("Invalid transformer id")
        requireTransformerAccess(transformerId, principal)
        val keys = metricsRepo.listKeys(transformerId)
        call.respond(HttpStatusCode.OK, keys)
    }
}
