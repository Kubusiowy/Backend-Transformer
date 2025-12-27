package com.example.features.auth

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post

fun Route.getAuthRoutes() {

    post("/auth/register") {

    }


}