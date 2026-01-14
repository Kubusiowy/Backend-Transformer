package com.example.plugins.Security

import com.auth0.jwt.JWTVerifier
import com.example.core.model.user.Role.UserRole
import java.util.UUID


interface JwtService {
    fun generateToken(userId: UUID, tenantId: UUID, role: UserRole): String
    fun generateRefreshToken(userId: UUID, tenantId: UUID): String
    fun verifier(): JWTVerifier
}