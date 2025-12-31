package com.example.features.auth.service

import com.example.features.auth.dto.Requests.RegisterInput
import com.example.features.auth.dto.Responses.RegisterResponse
import com.example.features.auth.dto.Responses.UserResponse
import com.example.features.auth.repo.AuthRepository
import com.example.plugins.Security.JwtService

class AuthService(
    private val repository: AuthRepository,
    private val jwtService: JwtService
) {

    suspend fun register(user: RegisterInput):String {
        require(user.rawPassword.length >= 8) {"password length must be more than 8"}
            require(user.email.contains("@")) { "email address must contain @" }

        val created = repository.registerUser(user)

        val token = jwtService.generateToken(created.userId,created.tenantId,created.role)

        return  token
    }

}