package com.example.features.auth.repo

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.TenantsTable
import com.example.core.db.exposedTables.UsersTable
import com.example.core.model.user.Role.Role
import com.example.features.auth.dto.RegisterResult
import com.example.features.auth.dto.Requests.RegisterInput
import com.example.features.auth.dto.Requests.RegisterRequest
import com.example.util.PasswordHasher
import org.jetbrains.exposed.sql.insert
import java.time.Instant
import java.util.UUID


class AuthRepository {

    suspend fun registerUser(input: RegisterInput): RegisterResult = dbQuery {

            val tenantId = UUID.randomUUID()
            val userId = UUID.randomUUID()

            TenantsTable.insert {
                it[id] = tenantId.toString()
                it[name] = "${input.name} ${input.surname}"
                it[createdAt] = Instant.now()
            }

            UsersTable.insert {
                it[id] = userId.toString()
                it[this.tenantId] = tenantId.toString()
                it[email] = input.email
                it[name] = input.name
                it[surname] = input.surname
                it[passwordHash] = PasswordHasher.hash(input.rawPassword)
                it[role] = Role.USER
                it[isActive] = true
                it[createdAt] = Instant.now()
            }

            RegisterResult(tenantId, userId,Role.USER)

    }




}