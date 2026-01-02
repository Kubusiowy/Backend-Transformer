package com.example.features.auth.common.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.UsersTable
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.insert
import java.time.Instant
import java.util.UUID
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select



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




}
