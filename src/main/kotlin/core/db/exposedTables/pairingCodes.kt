package com.example.core.db.exposedTables

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp


object PairingCodesTable : Table("pairing_codes") {
    val code = varchar("code", 20)
    val transformerId = char("transformer_id", 36)
        .references(TransformersTable.id, onDelete = ReferenceOption.CASCADE)
    val expiresAt = timestamp("expires_at")
    val usedAt = timestamp("used_at").nullable()
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(code)

    init {
        index("idx_pairing_transformer", false, transformerId)
        index("idx_pairing_expires", false, expiresAt)
    }
}
