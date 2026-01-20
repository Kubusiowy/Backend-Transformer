package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime


object RefreshSessions : Table("refresh_sessions") {
    val id = long("id").autoIncrement()

    val userId = char("user_id", 36) references Users.id

    val tokenHash = binary("token_hash", 32).uniqueIndex()

    val createdAt = datetime("created_at")
    val expiresAt = datetime("expires_at")
    val revokedAt = datetime("revoked_at").nullable()

    val deviceId = varchar("device_id", 128).nullable()
    val userAgent = varchar("user_agent", 255).nullable()
    val ip = binary("ip", 16).nullable()

    override val primaryKey = PrimaryKey(id)
}




