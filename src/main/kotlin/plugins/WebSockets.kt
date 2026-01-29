package com.example.plugins

import io.ktor.server.application.Application
import io.ktor.server.websocket.WebSockets
import io.ktor.server.application.install
import io.ktor.server.websocket.pingPeriod
import io.ktor.server.websocket.timeout
import java.time.Duration

fun Application.configureWebSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(20)
        timeout = Duration.ofSeconds(30)
        maxFrameSize = 1024 * 1024
        masking = false
    }
}
