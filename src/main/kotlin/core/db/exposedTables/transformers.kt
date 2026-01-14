package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object Transformers: Table("transformers") {
    val id = char("id", 36) //pk
    val userId = char("user_id", 36).index("idx_transformers_user_id")
    val name = varchar("name", 120)
    val location = varchar("location", 255).nullable()
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}