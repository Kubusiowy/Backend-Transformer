package com.example.features.auth.common.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.TenantsTable
import com.example.core.db.exposedTables.UsersTable
import com.example.core.util.PasswordHasher
import com.example.features.auth.register.domain.RegisterInput
import org.jetbrains.exposed.sql.insert
import java.time.Instant
import java.util.UUID

class AuthRepository {

    suspend fun createNewUser(input: RegisterInput): UUID = dbQuery {
        val userId = UUID.randomUUID()
        val tenantId = UUID.randomUUID()
        val now = Instant.now()

        TenantsTable.insert {
            it[id] = tenantId.toString()
            it[name] = input.email
            it[createdAt] = now
        }

        UsersTable.insert {
            it[UsersTable.id] = userId.toString()
            it[UsersTable.tenantId] = tenantId.toString()
            it[UsersTable.email] = input.email
            it[UsersTable.name] = input.username
            it[UsersTable.surname] = input.surname
            it[UsersTable.passwordHash] = PasswordHasher.hash(input.rawPassword)
            it[UsersTable.createdAt] = now
        }

        userId
    }

}
