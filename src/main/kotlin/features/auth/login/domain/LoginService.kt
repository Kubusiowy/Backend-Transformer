package com.example.features.auth.login.domain

import com.example.core.util.PasswordHasher
import com.example.features.auth.common.AuthRepository
import com.example.plugins.Security.JwtService

class LoginService(
    private val repo: AuthRepository,
    private val jwtService: JwtService
) {

    suspend fun login(input: LoginInput): LoginResult {


    }
}
