package com.example.features.auth.common

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.RefreshSessions
import com.example.core.db.exposedTables.Users
import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.User
import com.example.features.auth.common.mappers.toUser
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update
import java.time.Instant
import java.time.LocalDateTime
import java.util.UUID


class AuthRepository {

    suspend fun addRefreshToken(userId: String, tokenRefreshHash: String,expiresAt: LocalDateTime) = dbQuery {
        RefreshSessions.insert {
            it[RefreshSessions.userId] = userId
            it[RefreshSessions.tokenHash] = tokenRefreshHash
            it[RefreshSessions.createdAt] = LocalDateTime.now()
            it[RefreshSessions.expiresAt] = expiresAt
        }
    }



        suspend fun addUser(user: User): UUID = dbQuery {

            Users.insert {
                it[Users.id] = user.id.toString()
                it[Users.email] = user.email
                it[Users.passwordHash] = user.passwordHash
                it[Users.role] = user.role
                it[Users.createdAt] = Instant.now()
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

        suspend fun findById(id: UUID): User? = dbQuery {
            Users
                .selectAll()
                .where { Users.id eq id.toString() }
                .firstOrNull()
                ?.toUser()
        }

        suspend fun listUsers(): List<User> = dbQuery {
            Users.selectAll().map { it.toUser() }
        }

        suspend fun findActiveRefreshTokenHashesByUserId(userId: String): List<String> = dbQuery {
            RefreshSessions
                .selectAll()
                .where {
                    (RefreshSessions.userId eq userId) and
                            RefreshSessions.revokedAt.isNull() and
                            (RefreshSessions.expiresAt greater LocalDateTime.now())
                }
                .map { it[RefreshSessions.tokenHash] }
        }

        suspend fun existsByEmail(email: String): Boolean = dbQuery {
            Users.selectAll()
                .where { Users.email eq email }
                .limit(1)
                .empty().not()
        }

        suspend fun updatePasswordHash(id: UUID, newHashPass: String): Int = dbQuery {
            Users.update({ Users.id eq id.toString() }) {
                it[passwordHash] = newHashPass
            }
        }

        suspend fun updateRole(id: UUID, role: UserRole): Int = dbQuery {
            Users.update({ Users.id eq id.toString() }) {
                it[Users.role] = role
            }
        }

        suspend fun deleteById(id: UUID) = dbQuery {
            Users.deleteWhere { Users.id eq id.toString() }
        }




}
