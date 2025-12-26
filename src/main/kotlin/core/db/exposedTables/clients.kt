package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp


object ClientsTable : Table("clients") {
    val id = char("id", 36)
    val tenantId = char("tenant_id", 36).references(TenantsTable.id)
    val transformerId = char("transformer_id", 36)
        .references(TransformersTable.id, onDelete = ReferenceOption.CASCADE)
    val name = varchar("name", 120)
    val apiKeyHash = varchar("api_key_hash", 255)
    val isActive = bool("is_active").default(true)
    val lastSeen = timestamp("last_seen").nullable()
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex("uq_clients_tenant_name", tenantId, name)
        uniqueIndex("uq_clients_api_key_hash", apiKeyHash)
        index("idx_clients_transformer", false, transformerId)
    }
}
