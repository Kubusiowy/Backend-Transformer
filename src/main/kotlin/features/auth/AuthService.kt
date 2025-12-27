package com.example.features.auth

import com.example.features.auth.dto.Requests.RegisterRequest
import com.example.features.auth.dto.Responses.RegisterResponse
import com.example.plugins.Security.JwtServiceImpl
import java.util.UUID

class AuthService(
    private val repository: AuthRepository,
    private val jwtService: JwtServiceImpl
) {

}
