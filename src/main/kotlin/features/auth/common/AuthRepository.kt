package com.example.features.auth.common

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.UsersTable
import org.jetbrains.exposed.sql.insert
import java.time.Instant
import java.util.UUID

import org.jetbrains.exposed.sql.selectAll


class AuthRepository {

    suspend fun createNewUser(id: UUID, tenantID: UUID,
                              email: String, name: String,
                              surname:String, hashPass:String,
                              createdAt:Instant
    ): UUID = dbQuery {


        UsersTable.insert {
            it[UsersTable.id] = id.toString()
            it[UsersTable.tenantId] = tenantID.toString()
            it[UsersTable.email] = email
            it[UsersTable.name] = name
            it[UsersTable.surname] = surname
            it[UsersTable.passwordHash] = hashPass
            it[UsersTable.createdAt] = createdAt
        }

        id
    }

    suspend fun existsByEmail(email:String): Boolean =
        UsersTable
            .selectAll()
            .where {UsersTable.email eq email}
            .limit(1)
            .any()




}
