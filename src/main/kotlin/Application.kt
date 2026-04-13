package com.example

import com.example.core.db.DatabaseFactory
import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.User
import com.example.core.util.passHash.Hasher
import com.example.features.auth.common.AuthRepository
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
    DatabaseFactory.init()
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
        val email = "admin@admin"
        val rawPassword = "ZAQ!2wsx"
        val existingUser = authRepository.findByEmail(email)
        val passwordHash = hasher.hash(rawPassword)

        if (existingUser == null) {
            authRepository.addUser(
                User(
                    id = UUID.randomUUID(),
                    email = email,
                    passwordHash = passwordHash,
                    role = UserRole.ADMIN
                )
            )
            println("Created default admin account: $email")
            return@runBlocking
        }

        var updated = false

        if (existingUser.role != UserRole.ADMIN) {
            authRepository.updateRole(existingUser.id, UserRole.ADMIN)
            updated = true
        }

        if (!hasher.verify(rawPassword, existingUser.passwordHash)) {
            authRepository.updatePasswordHash(existingUser.id, passwordHash)
            updated = true
        }

        if (updated) {
            println("Updated default admin account: $email")
        }
    }
}
