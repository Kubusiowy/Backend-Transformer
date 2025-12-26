package com.example.plugins.Security

import com.example.core.config.JwtConfig

class JwtServiceImpl(
    private val cfg: JwtConfig
): JwtService {

    override fun generateToken(userId: String, tenantId: String, role: String): String{
        TODO("Not yes implemented")
    }

    override fun generateRefreshToken(userId: String, tenantId: String): String {
        TODO("Not yet implemented")
    }
}