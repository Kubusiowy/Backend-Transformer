package com.example.core.plugins

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*



fun Application.configureSecurity() {


    authentication {
        jwt("auth-jwt") {

        }
    }
}
