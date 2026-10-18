package com.example.WebApp.routing

import io.ktor.server.http.content.staticResources
import io.ktor.server.response.respondRedirect
import io.ktor.server.routing.Route
import io.ktor.server.routing.get

fun Route.webRoutes(){
    staticResources("/static", "static")

    get {
        call.respondRedirect("/static/index.html")
    }
}
