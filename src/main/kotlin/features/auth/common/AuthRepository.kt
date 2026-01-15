package com.example.features.auth.common

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.Users
import com.example.core.model.user.User
import com.example.features.auth.register.domain.DTO.request.UserRequest
import org.jetbrains.exposed.sql.insert

class AuthRepository {


    suspend fun addUser(user: User): User? = dbQuery {

        Users.insert {

        }

    }


}