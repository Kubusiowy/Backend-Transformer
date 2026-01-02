package com.example.features.auth.common.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.TenantsTable
import com.example.core.db.exposedTables.UsersTable
import com.example.core.model.user.User
import com.example.core.util.PasswordHasher
import com.example.features.auth.register.domain.RegisterInput
import org.jetbrains.exposed.sql.insert
import java.time.Instant
import java.util.UUID

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

    suspend fun findUser(id: UUID): User? {

    }



}
