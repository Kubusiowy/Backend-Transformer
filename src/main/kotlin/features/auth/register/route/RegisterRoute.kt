package com.example.features.auth.register.route

import com.example.features.auth.register.domain.DTO.request.RegisterRequest
import com.example.features.auth.register.domain.RegisterService
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import org.koin.ktor.ext.inject

fun Route.registerRoute() {

    val registerService: RegisterService by inject()

    post("/auth/register") {
        val req = call.receive<RegisterRequest>()
        val id = registerService.register(req)
        call.respond(HttpStatusCode.Created, mapOf("id" to id.toString()))

    }

}
