package com.example.features.auth.profile.route

import com.example.core.model.user.jwt.UserPrincipal
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.profile.domain.DTO.response.MeResponse
import com.example.plugins.StatusPage.errors.Unauthorized
import com.example.plugins.StatusPage.errors.NotFound
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import org.koin.ktor.ext.inject

fun Route.profileRoute() {
    val authRepo: AuthRepository by inject()

    fun getPrincipal(call: ApplicationCall): UserPrincipal =
        call.principal<UserPrincipal>() ?: throw Unauthorized("Unauthorized")

    get("/me") {
        val principal = getPrincipal(call)
        val user = authRepo.findById(principal.subject) ?: throw NotFound("User not found")
        call.respond(HttpStatusCode.OK, MeResponse(user.id, user.email, user.role))
    }
}
