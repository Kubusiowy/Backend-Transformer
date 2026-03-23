package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
import org.jetbrains.exposed.sql.javatime.datetime


object RefreshSessions : Table("refresh_sessions") {
    val id = long("id").autoIncrement()

    val userId = char("user_id", 36) references Users.id

    val tokenHash = varchar("token_hash", 255).uniqueIndex("uq_token_hash")

    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    val expiresAt = datetime("expires_at").index("idx_expires")
    val revokedAt = datetime("revoked_at").nullable()

    val deviceId = varchar("device_id", 128).nullable()
    val userAgent = varchar("user_agent", 255).nullable()
    val ip = binary("ip", 16).nullable()

    init {
        index("idx_user_active", false, userId, revokedAt, expiresAt)
    }

    override val primaryKey = PrimaryKey(id)
}


