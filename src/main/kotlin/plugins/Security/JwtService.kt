package com.example.plugins.Security

import com.example.core.model.user.Role.Role

interface JwtService {
    fun generateToken(userId: String, tenantId: String, role: String): String
    fun generateRefreshToken(userId: String, tenantId: String): String
}