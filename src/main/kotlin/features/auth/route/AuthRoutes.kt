package com.example.features.auth.route

import com.example.features.auth.dto.Requests.RegisterRequest
import io.ktor.server.request.receive
import io.ktor.server.routing.Route
import io.ktor.server.routing.post

fun Route.getAuthRoutes() {

    post("/auth/register") {
        call.receive<RegisterRequest>()

    }
}
