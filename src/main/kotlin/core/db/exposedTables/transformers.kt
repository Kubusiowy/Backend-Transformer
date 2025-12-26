package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object TransformersTable : Table("transformers") {
    val id = char("id", 36)
    val tenantId = char("tenant_id", 36).references(TenantsTable.id)
    val name = varchar("name", 120)
    val location = varchar("location", 120).nullable()
    val isActive = bool("is_active").default(true)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex("uq_transformers_tenant_name", tenantId, name)
        index("idx_transformers_tenant", false, tenantId)
    }
}
