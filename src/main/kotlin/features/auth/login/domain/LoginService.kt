package com.example.features.auth.login.domain

import com.example.core.util.passHash.Hasher
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.common.tokenDigest
import com.example.features.auth.login.domain.DTO.request.LoginRequest
import com.example.features.auth.login.domain.DTO.response.LoginResponse
import com.example.plugins.Security.JwtService
import com.example.plugins.StatusPage.errors.BadRequest
import java.time.LocalDateTime

class LoginService(
    private val repo: AuthRepository,
    private val jwtService: JwtService,
    private val passwordHasher: Hasher,
){

    suspend fun login(req: LoginRequest): LoginResponse {

        if(req.email.isBlank() || !req.email.contains("@")) throw BadRequest("Invalid email")
        if(req.rawPassword.isBlank() || req.rawPassword.toByteArray().size > 72) throw BadRequest("Invalid password")


        val normalizedEmail = req.email.trim().lowercase()

        val user = repo.findByEmail(normalizedEmail)?: throw BadRequest("Invalid credentials")
        val isValid = passwordHasher.verify(req.rawPassword, user.passwordHash)
        if(!isValid) throw BadRequest("Invalid credentials Validation")

        val token = jwtService.generateAccessToken(user.id, user.role)
        val refreshToken = jwtService.generateRefreshToken(user.id)
        val refreshTokenHash = tokenDigest(refreshToken)
        val expiresAt = LocalDateTime.now().plusDays(30)
        repo.addRefreshToken(user.id.toString(), refreshTokenHash, expiresAt)

        val role = user.role
        return LoginResponse(user.id, token, refreshToken, role)
    }
}
