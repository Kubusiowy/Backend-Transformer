package com.example.plugins

import com.example.features.auth.getAuthRoutes
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class test(val test:String)
fun Application.configureRouting() {

    routing {
        get("/"){
            call.receive<test>()
        }

        getAuthRoutes()

    }
}
