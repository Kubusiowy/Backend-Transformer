package com.example

import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty

// No production configuration, accounts or database are used by this preview.
fun main() {
    embeddedServer(Netty, host = "127.0.0.1", port = 8087) {
        isolatedModule()
        kotlinx.coroutines.runBlocking {
            com.example.features.auth.common.AuthRepository().addUser(com.example.core.model.user.User(
                java.util.UUID.randomUUID(), "preview@example.test",
                com.example.core.util.passHash.HasherIMPL.hash("PreviewOnly123"),
                com.example.core.model.user.Role.UserRole.ADMIN
            ))
        }
    }.start(wait = true)
}
