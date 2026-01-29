package com.example.features.IOT.metrics.route

import io.ktor.server.websocket.DefaultWebSocketServerSession
import io.ktor.websocket.send
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

object MetricsWsHub {
    private val sessions = ConcurrentHashMap<UUID, MutableSet<DefaultWebSocketServerSession>>()

    fun add(transformerId: UUID, session: DefaultWebSocketServerSession) {
        val set = sessions.computeIfAbsent(transformerId) { ConcurrentHashMap.newKeySet() }
        set.add(session)
    }

    fun remove(transformerId: UUID, session: DefaultWebSocketServerSession) {
        sessions[transformerId]?.remove(session)
        if (sessions[transformerId]?.isEmpty() == true) {
            sessions.remove(transformerId)
        }
    }

    suspend fun broadcast(transformerId: UUID, payload: String) {
        val snapshot = sessions[transformerId]?.toList() ?: return
        for (session in snapshot) {
            runCatching { session.send(payload) }
        }
    }
}
