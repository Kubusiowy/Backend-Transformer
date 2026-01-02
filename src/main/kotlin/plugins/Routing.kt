package com.example.plugins

import com.example.features.auth.register.api.route.registerRoutes
import io.ktor.server.application.*
import io.ktor.server.response.respondText
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable


fun Application.configureRouting() {

    routing {
        get {
            call.respondText("Server running...")
        }
        registerRoutes()

    }
}
