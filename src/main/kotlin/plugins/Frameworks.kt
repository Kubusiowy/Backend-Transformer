package com.example.plugins

import com.example.plugins.KOIN.appModule
import com.example.plugins.KOIN.configModule
import io.ktor.server.application.*
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger

fun Application.configureFrameworks() {
    install(Koin) {
        slf4jLogger()
        modules(configModule, appModule)
    }
}
