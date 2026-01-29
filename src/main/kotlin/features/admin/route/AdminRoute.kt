package com.example.features.admin.route

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.jwt.UserPrincipal
import com.example.core.util.passHash.Hasher
import com.example.features.admin.domain.DTO.request.ChangePasswordRequest
import com.example.features.admin.domain.DTO.request.ChangeRoleRequest
import com.example.features.admin.domain.DTO.response.AdminUserResponse
import com.example.features.auth.common.AuthRepository
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
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import org.koin.ktor.ext.inject
import java.util.UUID

fun Route.adminRoute() {
    val authRepo: AuthRepository by inject()
    val transformerRepo: TransformerRepository by inject()
    val hasher: Hasher by inject()

    fun getPrincipal(call: ApplicationCall): UserPrincipal =
        call.principal<UserPrincipal>() ?: throw Unauthorized("Unauthorized")

    fun requireAdmin(principal: UserPrincipal) {
        if (principal.role != UserRole.ADMIN) {
            throw Forbidden("Admin only")
        }
    }

    fun com.example.core.model.user.User.toResponse() = AdminUserResponse(
        id = id,
        email = email,
        role = role,
    )

    route("/admin/users") {
        get {
            val principal = getPrincipal(call)
            requireAdmin(principal)
            val users = authRepo.listUsers().map { it.toResponse() }
            call.respond(HttpStatusCode.OK, users)
        }
    }

    route("/admin/users/{id}") {
        get {
            val principal = getPrincipal(call)
            requireAdmin(principal)
            val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid user id")
            val user = authRepo.findById(id) ?: throw NotFound("User not found")
            call.respond(HttpStatusCode.OK, user.toResponse())
        }

        delete {
            val principal = getPrincipal(call)
            requireAdmin(principal)
            val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid user id")
            authRepo.findById(id) ?: throw NotFound("User not found")
            transformerRepo.deleteByUser(id)
            authRepo.deleteById(id)
            call.respond(HttpStatusCode.NoContent)
        }
    }

    route("/admin/users/{id}/password") {
        put {
            val principal = getPrincipal(call)
            requireAdmin(principal)
            val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid user id")
            authRepo.findById(id) ?: throw NotFound("User not found")
            val req = call.receive<ChangePasswordRequest>()
            if (req.newPassword.length < 6) {
                throw BadRequest("Password too short")
            }
            val hash = hasher.hash(req.newPassword)
            authRepo.updatePasswordHash(id, hash)
            call.respond(HttpStatusCode.OK)
        }
    }

    route("/admin/users/{id}/role") {
        put {
            val principal = getPrincipal(call)
            requireAdmin(principal)
            val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid user id")
            authRepo.findById(id) ?: throw NotFound("User not found")
            val req = call.receive<ChangeRoleRequest>()
            authRepo.updateRole(id, req.role)
            call.respond(HttpStatusCode.OK)
        }
    }

    route("/admin/users/{id}/transformers") {
        delete {
            val principal = getPrincipal(call)
            requireAdmin(principal)
            val id = call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid user id")
            authRepo.findById(id) ?: throw NotFound("User not found")
            transformerRepo.deleteByUser(id)
            call.respond(HttpStatusCode.NoContent)
        }
    }
}
