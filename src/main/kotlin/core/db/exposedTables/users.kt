package com.example.core.db.exposedTables

import com.example.core.model.user.Role.Role
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp


object UsersTable : Table("Users") {
    val id = char("id", 36)
    val tenantId = char("tenant_id", 36).references(TenantsTable.id)
    val email = varchar("email", 255)
    val name = varchar("name", 100)
    val surname = varchar("surname", 100)
    val passwordHash = varchar("password_hash", 255)
    val role = enumerationByName("role", 10, Role::class).default(Role.USER)
    val isActive = bool("is_active").default(true)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex("uq_users_tenant_email", tenantId, email)
        index("idx_users_tenant", false, tenantId)
    }
}
