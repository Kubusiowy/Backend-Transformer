package com.example.core.plugins

import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.statuspages.StatusPages

fun Application.configureStatusPage() {
    install(StatusPages) {


    }
}
