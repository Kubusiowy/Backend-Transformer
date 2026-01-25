package com.example.plugins

import com.example.WebApp.routing.webRoutes
import com.example.features.auth.login.route.loginRoute
import com.example.features.auth.refresh.route.refreshRoutes
import com.example.features.auth.register.route.registerRoute
import io.ktor.server.application.*
import io.ktor.server.routing.*


fun Application.configureRouting() {

    routing {

        //web
        webRoutes()

        registerRoute()

        loginRoute()

        refreshRoutes()

    }
}
