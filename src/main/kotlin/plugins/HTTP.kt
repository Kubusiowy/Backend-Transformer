package com.example.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*
import com.example.core.config.dotenv

fun Application.configureHTTP() {
    install(CORS) {
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Patch)
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        (System.getenv("CORS_ORIGINS") ?: dotenv.get("CORS_ORIGINS") ?: "")
            .split(",").map(String::trim).filter(String::isNotEmpty).forEach { origin ->
                val uri = java.net.URI(origin)
                require(uri.scheme in listOf("http", "https") && uri.host != null) { "Invalid CORS_ORIGINS entry" }
                allowHost(uri.rawAuthority, schemes = listOf(uri.scheme))
            }
    }
}
