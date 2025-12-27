package com.example.plugins.Security

import com.example.core.model.user.Role.Role
import java.util.UUID


interface JwtService {
    fun generateToken(userId: UUID, tenantId: UUID, role: Role): String
    fun generateRefreshToken(userId: UUID, tenantId: UUID): String
}