package com.example.features.auth.service

import com.example.features.auth.repo.AuthRepository
import com.example.plugins.Security.JwtService

class AuthService(
    private val repository: AuthRepository,
    private val jwtService: JwtService
) {


}