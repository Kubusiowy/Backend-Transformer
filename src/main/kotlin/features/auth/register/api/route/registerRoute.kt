package com.example.features.auth.register.api.route

import com.example.features.auth.register.api.dto.RegisterRequest
import com.example.features.auth.register.domain.RegisterResult
import com.example.features.auth.register.domain.RegisterService
import com.example.features.auth.register.domain.mapper.toInput
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import org.koin.ktor.ext.inject

fun Route.registerRoutes() {

        val registerService: RegisterService by inject()

    post("/register") {
       val req = call.receive<RegisterRequest>()

        val input = req.toInput()

       when(val result = registerService.register(input)){
           is RegisterResult.Success -> {
               call.respond(HttpStatusCode.Created, result)
           }

           is RegisterResult.Failure -> {
               call.respond(HttpStatusCode.BadRequest, result)
           }
       }

    }
}