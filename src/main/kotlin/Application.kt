package com.example

import com.example.core.db.DatabaseFactory
import com.example.core.config.dotenv
import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.User
import com.example.core.util.passHash.Hasher
import com.example.features.auth.common.AuthRepository
import com.example.plugins.configureFrameworks
import com.example.plugins.configureHTTP
import com.example.plugins.configureMonitoring
import com.example.plugins.configureRouting
import com.example.plugins.configureSecurity
import com.example.plugins.configureSerialization
import com.example.plugins.configureStatusPage
import com.example.plugins.configureWebSockets
import io.ktor.server.application.*
import kotlinx.coroutines.runBlocking
import org.koin.ktor.ext.inject
import java.util.UUID


fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    configureFrameworks()
    DatabaseFactory.init()
    monitor.subscribe(ApplicationStopped) { DatabaseFactory.close() }
    ensureDefaultAdmin()
    configureHTTP()
    configureWebSockets()
    configureSecurity()
    configureMonitoring()
    configureSerialization()
    configureStatusPage()
    configureRouting()
}

private fun Application.ensureDefaultAdmin() {
    val authRepository by inject<AuthRepository>()
    val hasher by inject<Hasher>()

    runBlocking {
        val email = (System.getenv("BOOTSTRAP_ADMIN_EMAIL") ?: dotenv.get("BOOTSTRAP_ADMIN_EMAIL"))
            ?.trim()?.lowercase() ?: return@runBlocking
        val rawPassword = System.getenv("BOOTSTRAP_ADMIN_PASSWORD") ?: dotenv.get("BOOTSTRAP_ADMIN_PASSWORD")
            ?: error("BOOTSTRAP_ADMIN_PASSWORD is required when BOOTSTRAP_ADMIN_EMAIL is set")
        require(rawPassword.length >= 8 && rawPassword.toByteArray().size <= 72) { "Invalid bootstrap password length" }
        val existingUser = authRepository.findByEmail(email)
        if (existingUser != null) return@runBlocking
        val passwordHash = hasher.hash(rawPassword)

        authRepository.addUser(
                User(
                    id = UUID.randomUUID(),
                    email = email,
                    passwordHash = passwordHash,
                    role = UserRole.ADMIN
                )
            )
        log.info("Created bootstrap administrator")

    }
}
