package com.example

import com.example.core.db.DatabaseFactory
import com.example.plugins.configureFrameworks
import com.example.plugins.configureHTTP
import com.example.plugins.configureMonitoring
import com.example.plugins.configureRouting
import com.example.plugins.configureSecurity
import com.example.plugins.configureSerialization
import com.example.plugins.configureStatusPage
import io.ktor.server.application.*


fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {


    configureFrameworks()
    DatabaseFactory.init()
    configureHTTP()
    configureSecurity()
    configureMonitoring()
    configureSerialization()
    configureStatusPage()
    configureRouting()
}
