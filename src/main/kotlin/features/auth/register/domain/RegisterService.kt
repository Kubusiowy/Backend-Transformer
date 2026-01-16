package com.example.features.auth.register.domain

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.User
import com.example.core.util.PasswordHasher
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.register.domain.DTO.request.UserRequest
import com.example.features.auth.register.domain.DTO.request.toUserModel
import java.util.UUID

class RegisterService(
    private val authRepository: AuthRepository,
) {

    suspend fun register(req: UserRequest): String {
        val id = UUID.randomUUID()
        val reqEmail = req.email



    }
}
