package com.example.features.auth.login.api.route

import com.example.features.auth.login.api.dto.LoginRequest
import com.example.features.auth.login.domain.LoginService
import com.example.features.auth.login.domain.mapper.toInput
import io.ktor.server.request.receive
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import org.koin.ktor.ext.inject

fun Route.loginRoutes() {
    val loginService: LoginService by inject()

    post("/login") {
        val req = call.receive<LoginRequest>()
        val input = req.toInput()


    }
}
