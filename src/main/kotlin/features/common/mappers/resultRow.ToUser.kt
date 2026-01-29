package com.example.features.common.mappers

import com.example.core.db.exposedTables.Users
import com.example.core.model.user.User
import org.jetbrains.exposed.sql.ResultRow
import java.util.UUID

fun ResultRow.toUser():User = User(
    id = UUID.fromString(this[Users.id]),
    email = this[Users.email],
    passwordHash = this[Users.passwordHash],
    role = this[Users.role]
)