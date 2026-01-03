package com.example.plugins

import com.example.WebApp.routing.webRoutes
import com.example.features.auth.login.api.route.loginRoutes
import com.example.features.auth.register.api.route.registerRoutes
import io.ktor.server.application.*
import io.ktor.server.http.content.resources
import io.ktor.server.http.content.static
import io.ktor.server.response.respondRedirect
import io.ktor.server.response.respondText
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable


fun Application.configureRouting() {

    routing {

        //web
        webRoutes()

        //logowanie/rejestracja
        registerRoutes()
        loginRoutes()



    }
}
