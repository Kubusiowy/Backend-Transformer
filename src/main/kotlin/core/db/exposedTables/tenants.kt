package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp


object TenantsTable : Table("tenants") {
    val id = char("id", 36)
    val name = varchar("name", 120)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}
