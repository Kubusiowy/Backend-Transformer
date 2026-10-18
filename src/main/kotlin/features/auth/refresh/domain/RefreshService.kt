package com.example.features.auth.refresh.domain

import com.example.core.util.passHash.Hasher
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.common.tokenDigest
import com.example.features.auth.refresh.domain.DTO.request.RefreshRequest
import com.example.features.auth.refresh.domain.DTO.response.RefreshResponse
import com.example.plugins.Security.JwtService
import com.example.plugins.StatusPage.errors.BadRequest
import com.example.plugins.StatusPage.errors.Unauthorized
import com.auth0.jwt.exceptions.JWTVerificationException
import java.util.UUID

class RefreshService(
    private val repo: AuthRepository,
    private val jwt : JwtService
) {

    suspend fun refresh(req: RefreshRequest):RefreshResponse {
        if(req.refreshToken.isBlank()) throw BadRequest("Token cannot be empty")

        val decoded = try { jwt.verifier().verify(req.refreshToken) }
            catch (_: JWTVerificationException) { throw Unauthorized("Invalid refresh token") }
        if (decoded.getClaim("type").asString() != "refresh") throw Unauthorized("Invalid refresh token")
        val userId = runCatching { UUID.fromString(decoded.subject) }.getOrNull()
            ?: throw Unauthorized("Invalid refresh token")

        val user = repo.findById(userId) ?: throw Unauthorized("Invalid refresh token")

        val hashes = repo.findActiveRefreshTokenHashesByUserId(userId.toString())
        val ok = tokenDigest(req.refreshToken) in hashes
        if(!ok) throw Unauthorized("Invalid refresh token")
        val access = jwt.generateAccessToken(userId,user.role)

        return RefreshResponse(access)

    }
}
