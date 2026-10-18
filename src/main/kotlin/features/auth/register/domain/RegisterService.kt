package com.example.features.auth.register.domain

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.User
import com.example.core.util.passHash.Hasher
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.register.domain.DTO.request.RegisterRequest
import com.example.features.auth.register.domain.DTO.request.toUserModel
import com.example.plugins.StatusPage.errors.BadRequest
import com.example.plugins.StatusPage.errors.Conflict
import java.util.UUID

class RegisterService(
    private val authRepository: AuthRepository,
    private val passwordHasher: Hasher,
) {

    suspend fun register(req: RegisterRequest): UUID {

        if(req.email.isBlank()) throw BadRequest("Please enter a valid email")
        if(!req.email.contains("@")) throw BadRequest("Please enter a valid email")
        if(req.email.trim().length > 255) throw BadRequest("Email is too long")
        if(req.rawPassword.length < 8 || req.rawPassword.toByteArray().size > 72) throw BadRequest("Password must have at least 8 characters and at most 72 UTF-8 bytes")

        val normalizedEmail = req.email.trim().lowercase()

        if(authRepository.existsByEmail(normalizedEmail)) throw Conflict("User already exists")

        val id = UUID.randomUUID()
        val passwordHash = passwordHasher.hash(req.rawPassword)

        val user = req.toUserModel(id,passwordHash)

        authRepository.addUser(user)

        return id




    }
}
