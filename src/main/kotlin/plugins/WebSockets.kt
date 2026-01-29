package com.example.plugins

import io.ktor.server.application.Application
import io.ktor.server.websocket.WebSockets
import io.ktor.server.application.install
import io.ktor.server.websocket.pingPeriod
import io.ktor.server.websocket.timeout
import kotlin.time.Duration.Companion.seconds

fun Application.configureWebSockets() {
    install(WebSockets) {
        pingPeriod = 20.seconds
        timeout = 30.seconds
        maxFrameSize = 1024 * 1024
        masking = false
    }
}
