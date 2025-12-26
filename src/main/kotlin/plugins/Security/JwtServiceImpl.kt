package com.example.plugins.Security

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import com.example.core.config.JwtConfig
import java.util.Date

class JwtServiceImpl(
    private val cfg: JwtConfig
): JwtService {

    val algorithm = Algorithm.HMAC256(cfg.jwtSecret)

    override fun generateToken(userId: String, tenantId: String, role: String): String{
        return JWT.create()
            .withIssuer(cfg.jwtIssuer)
            .withAudience(cfg.jwtAudience)
            .withSubject(userId)
            .withClaim("tenant_id", tenantId)
            .withClaim("role", role)
            .withIssuedAt(Date(System.currentTimeMillis()))
            .withExpiresAt(Date(System.currentTimeMillis() + 15 * 60 * 1000))                 // 15 min
            .sign(algorithm)
    }

    override fun generateRefreshToken(userId: String, tenantId: String): String {
        TODO("Not yet implemented")
    }

    fun verifier(): JWTVerifier = JWT.require(algorithm)
        .withIssuer(cfg.jwtIssuer)
        .withAudience(cfg.jwtAudience)
        .build()
}