package com.example.plugins.Security

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import com.example.core.config.JwtConfig
import com.example.core.model.user.Role.Role
import java.util.Date
import java.util.UUID

class JwtServiceImpl(
    private val cfg: JwtConfig
): JwtService {

    val algorithm = Algorithm.HMAC256(cfg.jwtSecret)

    override fun generateToken(userId: UUID, tenantId: UUID, role: Role): String{
        return JWT.create()
            .withIssuer(cfg.jwtIssuer)
            .withAudience(cfg.jwtAudience)
            .withSubject(userId.toString())
            .withClaim("tenant_id", tenantId.toString())
            .withClaim("role", role.name)
            .withIssuedAt(Date(System.currentTimeMillis()))
            .withExpiresAt(Date(System.currentTimeMillis() + 15 * 60 * 1000))                 // 15 min
            .sign(algorithm)
    }

    override fun generateRefreshToken(userId: UUID, tenantId: UUID): String {
        return JWT.create()
            .withIssuer(cfg.jwtIssuer)
            .withAudience(cfg.jwtAudience)
            .withSubject(userId.toString())
            .withClaim("tenant_id", tenantId.toString())
            .withIssuedAt(Date(System.currentTimeMillis()))
            .withExpiresAt(Date(System.currentTimeMillis() + 30L * 24 * 60 * 60 * 1000)) // 30 days
            .sign(algorithm)
    }

    override fun verifier(): JWTVerifier = JWT.require(algorithm)
        .withIssuer(cfg.jwtIssuer)
        .withAudience(cfg.jwtAudience)
        .build()
}
