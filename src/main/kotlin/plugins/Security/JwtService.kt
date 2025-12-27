package com.example.plugins.Security

import com.auth0.jwt.JWTVerifier
import com.example.core.model.user.Role.Role
import java.util.UUID


interface JwtService {
    fun generateToken(userId: UUID, tenantId: UUID, role: Role): String
    fun generateRefreshToken(userId: UUID, tenantId: UUID): String
    fun verifier(): JWTVerifier
}