package com.example.plugins

import com.example.features.auth.route.getAuthRoutes
import io.ktor.server.application.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class test(val test:String)
fun Application.configureRouting() {

    routing {

        getAuthRoutes()

    }
}
