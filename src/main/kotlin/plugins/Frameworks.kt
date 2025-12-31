package com.example.plugins

import com.example.plugins.KOIN.authModule
import com.example.plugins.KOIN.loadCfgModule
import com.example.plugins.KOIN.securityModule
import io.ktor.server.application.*
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger

fun Application.configureFrameworks() {
    install(Koin) {
        slf4jLogger()
        modules(loadCfgModule, securityModule,authModule)
    }
}
