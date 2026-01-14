package com.example.core.db.exposedTables

import com.example.core.model.user.Role.UserRole
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object Users : Table("users") {
    val id = char("id", 36)
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val role = enumerationByName("role", 16, UserRole::class).default(UserRole.USER)
    val createdAt = timestamp("created_at")
    override val primaryKey = PrimaryKey(id)
}
