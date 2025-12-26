package com.example.features.auth

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get

fun Route.getAuthRoutes() {
    get("/auth") {
        call.respondText("Hello World!", status = HttpStatusCode.OK)
    }
}