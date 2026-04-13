package com.example.core.plugins

import com.example.core.database.DI.databaseModule
import io.ktor.server.application.*
import io.ktor.server.config.ApplicationConfig
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger

fun Application.configureFrameworks() {
    install(Koin) {
        slf4jLogger()
        modules(
            module {

                single < ApplicationConfig> {environment.config}
            },
            databaseModule,
        )
    }
}
