package com.example.features.IOT.metrics.route

import kotlinx.coroutines.channels.Channel
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

object MetricsWsHub {
    private val subscribers = ConcurrentHashMap<UUID, MutableSet<Channel<String>>>()
    fun add(transformerId: UUID): Channel<String> {
        val queue = Channel<String>(64)
        subscribers.compute(transformerId) { _, existing ->
            (existing ?: ConcurrentHashMap.newKeySet()).also { it.add(queue) }
        }
        return queue
    }
    fun remove(transformerId: UUID, queue: Channel<String>) {
        subscribers.computeIfPresent(transformerId) { _, set ->
            set.remove(queue)
            set.takeIf { it.isNotEmpty() }
        }
        queue.close()
    }
    fun broadcast(transformerId: UUID, payload: String) {
        // Slow subscribers cannot block ingestion or other subscribers.
        subscribers[transformerId]?.forEach { queue ->
            if (queue.trySend(payload).isFailure) remove(transformerId, queue)
        }
    }
}
