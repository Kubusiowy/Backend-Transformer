package com.example.features.auth

import com.example.features.auth.dto.Requests.RegisterRequest
import com.example.plugins.Security.JwtServiceImpl
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import org.koin.ktor.ext.get

fun Route.getAuthRoutes() {

    post("/auth/register") {

    }


}
