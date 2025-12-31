package com.example.features.auth.repo

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.TenantsTable
import com.example.core.db.exposedTables.UsersTable
import com.example.core.model.user.Role.Role
import com.example.features.auth.dto.Requests.RegisterRequest
import com.example.util.PasswordHasher
import org.jetbrains.exposed.sql.insert
import java.time.Instant
import java.util.UUID

data class RegisterResult(val tenantId:String, val userId:String)


class AuthRepository {

    suspend fun registerUser(userRegister: RegisterRequest): RegisterResult = dbQuery {

            val tenant_Id = UUID.randomUUID().toString()
            val userId = UUID.randomUUID().toString()
            TenantsTable.insert {
                it[id] = tenant_Id
                it[name] = "${userRegister.name} ${userRegister.surname}"
                it[createdAt] = Instant.now()
            }

            UsersTable.insert {
                it[id] = userId
                it[tenantId] = tenant_Id
                it[email] = userRegister.email
                it[name] = userRegister.name
                it[surname] = userRegister.surname
                it[passwordHash] = PasswordHasher.hash(userRegister.password)
                it[role] = Role.USER
                it[isActive] = true
                it[createdAt] = Instant.now()
            }

            RegisterResult(tenant_Id, userId)

    }




}