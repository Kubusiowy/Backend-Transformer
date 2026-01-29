package com.example.plugins

import com.example.WebApp.routing.webRoutes
import com.example.features.IOT.transformer.route.transformerRoute
import com.example.features.IOT.meter.route.meterRoute
import com.example.features.IOT.metrics.route.metricsRoute
import com.example.features.IOT.metrics.route.metricsWsRoute
import com.example.features.admin.route.adminRoute
import com.example.features.auth.profile.route.profileRoute
import com.example.features.auth.login.route.loginRoute
import com.example.features.auth.refresh.route.refreshRoutes
import com.example.features.auth.register.route.registerRoute
import io.ktor.server.application.*
import io.ktor.server.auth.authenticate
import io.ktor.server.routing.*


fun Application.configureRouting() {

    routing {

        //web
        webRoutes()

        registerRoute()

        loginRoute()

        refreshRoutes()

        metricsWsRoute()

        authenticate("auth-jwt") {
            transformerRoute()
            meterRoute()
            metricsRoute()
            adminRoute()
            profileRoute()
        }

    }
}
