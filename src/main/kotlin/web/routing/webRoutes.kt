package com.example.WebApp.routing

import io.ktor.server.http.content.resources
import io.ktor.server.http.content.static
import io.ktor.server.response.respondRedirect
import io.ktor.server.routing.Route
import io.ktor.server.routing.get

fun Route.webRoutes(){
    static("/static") {
        resources("static")
    }

    get {
        call.respondRedirect("/static/index.html")
    }
}