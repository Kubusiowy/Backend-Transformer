package com.example.features.auth.common

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.UsersTable
import com.example.core.model.user.AuthLoginUser
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

    suspend fun existsByEmail(email:String): Boolean = dbQuery {
        UsersTable
            .selectAll()
            .where { UsersTable.email eq email }
            .limit(1)
            .any()
    }

    suspend fun findAuthUserByEmail(email:String): AuthLoginUser? = dbQuery {
        UsersTable
            .selectAll()
            .where{ UsersTable.email eq email }
            .limit(1)
            .map {
                AuthLoginUser(
                    id = UUID.fromString(it[UsersTable.id]),
                    tenantId = UUID.fromString(it[UsersTable.tenantId]),
                    email = it[UsersTable.email],
                    hashPassword = it[UsersTable.passwordHash],
                    role = it[UsersTable.role],
                    isActive = it[UsersTable.isActive]
                )
            }
            .singleOrNull()
    }




}
