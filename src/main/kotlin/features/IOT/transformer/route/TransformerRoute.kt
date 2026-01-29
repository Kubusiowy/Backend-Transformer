package com.example.features.IOT.transformer.route

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.jwt.UserPrincipal
import com.example.features.IOT.transformer.data.TransformerRepository
import com.example.features.IOT.transformer.domain.DTO.request.TransformerRequest
import com.example.features.IOT.transformer.domain.DTO.request.TransformerUpdateRequest
import com.example.features.IOT.transformer.domain.DTO.response.TransformerResponse
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
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import org.koin.ktor.ext.inject
import java.util.UUID

fun Route.transformerRoute() {
    val repo: TransformerRepository by inject()

    fun getPrincipal(call: ApplicationCall): UserPrincipal =
        call.principal<UserPrincipal>() ?: throw Unauthorized("Unauthorized")

    fun ensureAccess(record: TransformerRepository.TransformerRecord, principal: UserPrincipal) {
        if (principal.role != UserRole.ADMIN && record.userId != principal.subject) {
            throw Forbidden("Brak dostepu do transformatora")
        }
    }

    suspend fun listTransformers(
        principal: UserPrincipal,
        userIdParam: String?,
    ): List<TransformerRepository.TransformerRecord> {
        return if (principal.role == UserRole.ADMIN && !userIdParam.isNullOrBlank()) {
            val userId = runCatching { UUID.fromString(userIdParam) }.getOrNull()
                ?: throw BadRequest("Invalid userId")
            repo.listByUser(userId)
        } else if (principal.role == UserRole.ADMIN) {
            repo.listAll()
        } else {
            repo.listByUser(principal.subject)
        }
    }

    fun TransformerRepository.TransformerRecord.toResponse() = TransformerResponse(
        id = id,
        userId = userId,
        name = name,
        location = location
    )

    get("/transformer") {
        val principal = getPrincipal(call)
        val transformers = listTransformers(principal, call.request.queryParameters["userId"]).map { it.toResponse() }
        call.respond(HttpStatusCode.OK, transformers)
    }

    get("/transformers") {
        val principal = getPrincipal(call)
        val transformers = listTransformers(principal, call.request.queryParameters["userId"]).map { it.toResponse() }
        call.respond(HttpStatusCode.OK, transformers)
    }

    get("/transformer/{id}") {
        val principal = getPrincipal(call)
        val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: throw BadRequest("Invalid transformer id")
        val transformer = repo.findById(id) ?: throw NotFound("Transformer not found")
        ensureAccess(transformer, principal)
        call.respond(HttpStatusCode.OK, transformer.toResponse())
    }

    get("/transformers/{id}") {
        val principal = getPrincipal(call)
        val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: throw BadRequest("Invalid transformer id")
        val transformer = repo.findById(id) ?: throw NotFound("Transformer not found")
        ensureAccess(transformer, principal)
        call.respond(HttpStatusCode.OK, transformer.toResponse())
    }

    post("/transformer") {
        val principal = getPrincipal(call)
        val req = call.receive<TransformerRequest>()
        if (req.name.isBlank()) {
            throw BadRequest("Name is required")
        }
        val record = repo.create(principal.subject, req.name.trim(), req.location?.trim())
        call.respond(HttpStatusCode.Created, record.toResponse())
    }

    post("/transformers") {
        val principal = getPrincipal(call)
        val req = call.receive<TransformerRequest>()
        if (req.name.isBlank()) {
            throw BadRequest("Name is required")
        }
        val record = repo.create(principal.subject, req.name.trim(), req.location?.trim())
        call.respond(HttpStatusCode.Created, record.toResponse())
    }

    put("/transformer/{id}") {
        val principal = getPrincipal(call)
        val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: throw BadRequest("Invalid transformer id")
        val existing = repo.findById(id) ?: throw NotFound("Transformer not found")
        ensureAccess(existing, principal)
        val req = call.receive<TransformerUpdateRequest>()
        val name = req.name?.trim()?.takeIf { it.isNotBlank() } ?: existing.name
        val location = req.location?.trim() ?: existing.location
        repo.update(id, name, location)
        val updated = repo.findById(id) ?: existing
        call.respond(HttpStatusCode.OK, updated.toResponse())
    }

    put("/transformers/{id}") {
        val principal = getPrincipal(call)
        val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: throw BadRequest("Invalid transformer id")
        val existing = repo.findById(id) ?: throw NotFound("Transformer not found")
        ensureAccess(existing, principal)
        val req = call.receive<TransformerUpdateRequest>()
        val name = req.name?.trim()?.takeIf { it.isNotBlank() } ?: existing.name
        val location = req.location?.trim() ?: existing.location
        repo.update(id, name, location)
        val updated = repo.findById(id) ?: existing
        call.respond(HttpStatusCode.OK, updated.toResponse())
    }

    delete("/transformer/{id}") {
        val principal = getPrincipal(call)
        val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: throw BadRequest("Invalid transformer id")
        val existing = repo.findById(id) ?: throw NotFound("Transformer not found")
        ensureAccess(existing, principal)
        repo.delete(id)
        call.respond(HttpStatusCode.NoContent)
    }

    delete("/transformers/{id}") {
        val principal = getPrincipal(call)
        val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: throw BadRequest("Invalid transformer id")
        val existing = repo.findById(id) ?: throw NotFound("Transformer not found")
        ensureAccess(existing, principal)
        repo.delete(id)
        call.respond(HttpStatusCode.NoContent)
    }
}
