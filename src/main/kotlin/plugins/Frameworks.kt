package com.example.plugins


import io.ktor.server.application.*
import com.example.plugins.KOIN.JwtModule
import com.example.plugins.KOIN.LoadCfg
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger

fun Application.configureFrameworks() {
    install(Koin) {
        slf4jLogger()
        modules(JwtModule, LoadCfg)
    }
}
