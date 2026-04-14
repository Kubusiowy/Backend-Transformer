package com.example

import com.example.core.plugins.configureFrameworks
import com.example.core.plugins.configureHTTP
import com.example.core.plugins.configureMonitoring
import com.example.core.plugins.configureRouting
import com.example.core.plugins.configureSecurity
import com.example.core.plugins.configureSerialization
import com.example.core.plugins.configureStatusPage
import com.example.core.plugins.configureWebSockets
import io.ktor.server.application.*
import kotlinx.coroutines.runBlocking
import org.koin.ktor.ext.inject
import java.util.UUID


fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    configureFrameworks()


    configureHTTP()
    configureWebSockets()
    configureSecurity()
    configureMonitoring()
    configureSerialization()
    configureStatusPage()
    configureRouting()
}
