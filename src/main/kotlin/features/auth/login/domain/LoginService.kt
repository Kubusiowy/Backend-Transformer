package com.example.features.auth.login.domain

import com.example.core.util.passHash.PasswordHasher
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.login.domain.DTO.request.LoginRequest
import com.example.features.auth.login.domain.DTO.response.LoginResponse
import com.example.plugins.Security.JwtService
import com.example.plugins.StatusPage.errors.BadRequest

class LoginService(
    private val repo: AuthRepository,
    private val jwtService: JwtService,
    private val passwordHasher: PasswordHasher,
){

    suspend fun login(req: LoginRequest): LoginResponse {

        if(req.email.isBlank() || !req.email.contains("@")) throw BadRequest("Invalid email")
        if(req.rawPassword.isBlank() || req.rawPassword.length < 8) throw BadRequest("Invalid password")


        val normalizedEmail = req.email.trim().lowercase()

        val user = repo.findByEmail(normalizedEmail)?: throw BadRequest("Invalid credentials")
        println(user)
        val isValid = passwordHasher.verifyPassword(req.rawPassword, user.passwordHash)
        println(isValid)
        if(!isValid) throw BadRequest("Invalid credentials Validation")

        val token = jwtService.generateToken(user.id,user.role)
        return LoginResponse(user.id, token)
    }
}