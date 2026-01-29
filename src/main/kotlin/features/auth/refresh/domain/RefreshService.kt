package com.example.features.auth.refresh.domain

import com.example.core.util.passHash.Hasher
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.refresh.domain.DTO.request.RefreshRequest
import com.example.features.auth.refresh.domain.DTO.response.RefreshResponse
import com.example.plugins.Security.JwtService
import com.example.plugins.StatusPage.errors.BadRequest
import java.util.UUID

class RefreshService(
    private val hasher: Hasher,
    private val repo: AuthRepository,
    private val jwt : JwtService
) {

    suspend fun refresh(req: RefreshRequest):RefreshResponse {
        if(req.refreshToken.isBlank()) throw BadRequest("Token cannot be empty")

        val decoded = jwt.verifier().verify(req.refreshToken)
        val userId = UUID.fromString(decoded.subject)

        val user = repo.findById(userId) ?: throw BadRequest("User with id $userId not found")

        val hashes = repo.findActiveRefreshTokenHashesByUserId(userId.toString())
        val ok = hashes.any {hasher.verify(req.refreshToken, it)}
        if(!ok) throw BadRequest("Invalid refresh token")
        val access = jwt.generateAccessToken(userId,user.role)

        return RefreshResponse(access)

    }
}
