package com.example.features.auth.common

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.Users
import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.User
import com.example.features.auth.common.mappers.toUser
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update
import java.util.UUID


class AuthRepository {

    suspend fun addRefreshTokenToDatabase(){

    }


    suspend fun addUser(user: User): UUID = dbQuery {

        Users.insert {
            it[Users.id] = user.id .toString()
            it[Users.email] = user.email
            it[Users.passwordHash] = user.passwordHash
            it[Users.role] = user.role
        }
        user.id
    }

    suspend fun findByEmail(email: String): User? = dbQuery {
        Users
            .selectAll()
            .where { Users.email eq email }
            .firstOrNull()
            ?.toUser()

    }

    suspend fun existsByEmail(email: String): Boolean = dbQuery {
        Users.selectAll()
            .where { Users.email eq email }
            .limit(1)
            .empty().not()
    }

    suspend fun updatePasswordHash(id:UUID,newHashPass:String):Int = dbQuery {
        Users.update({ Users.id eq id.toString() }) {
            it[passwordHash] = newHashPass
        }
    }

    suspend fun updateRole(id: UUID, role: UserRole): Int = dbQuery {
        Users.update({Users.id eq id.toString() }) {
            it[Users.role] = role
        }
    }

    suspend fun deleteById(id: UUID) = dbQuery {
        Users.deleteWhere { Users.id eq id.toString() }
    }







}
