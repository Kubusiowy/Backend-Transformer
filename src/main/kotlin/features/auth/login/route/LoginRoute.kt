package com.example.features.auth.login.route

import com.example.features.auth.login.domain.DTO.request.LoginRequest
import com.example.features.auth.login.domain.LoginService
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import org.koin.ktor.ext.inject

fun Route.loginRoute(){

    val loginService: LoginService by inject()

    post("/auth/login") {
        val req = call.receive<LoginRequest>()
        val response = loginService.login(req)
        call.respond(HttpStatusCode.OK, response)

    }

}