package com.example.features.auth.common

import com.example.core.db.dbQuery
import com.example.features.auth.register.domain.DTO.request.UserRequest

class AuthRepository {


    suspend fun addUser(user: UserRequest) = dbQuery {

    }


}