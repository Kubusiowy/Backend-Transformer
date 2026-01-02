package com.example.plugins

import com.example.features.auth.register.api.route.registerRoutes
import io.ktor.server.application.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable


fun Application.configureRouting() {

    routing {

        registerRoutes()

    }
}
