package com.example

import com.example.plugins.configureFrameworks
import com.example.plugins.configureHTTP
import com.example.plugins.configureMonitoring
import com.example.plugins.configureRouting
import com.example.plugins.configureSecurity
import com.example.plugins.configureSerialization
import io.ktor.server.application.*

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    configureHTTP()
    configureSecurity()
    configureMonitoring()
    configureSerialization()
    configureFrameworks()
    configureRouting()
}
