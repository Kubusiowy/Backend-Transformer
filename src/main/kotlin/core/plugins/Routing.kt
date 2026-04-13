package com.example.core.plugins


import io.ktor.server.application.*
import io.ktor.server.auth.authenticate
import io.ktor.server.routing.*


fun Application.configureRouting() {

    routing {




        authenticate("auth-jwt") {

        }

    }
}
