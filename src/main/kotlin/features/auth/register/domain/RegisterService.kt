package com.example.features.auth.register.domain

import com.example.core.util.passHash.PasswordHasher
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.register.domain.DTO.request.UserRequest
import com.example.features.auth.register.domain.DTO.request.toUserModel
import com.example.plugins.StatusPage.errors.BadRequest
import com.example.plugins.StatusPage.errors.Conflict
import java.util.UUID

class RegisterService(
    private val authRepository: AuthRepository,
    private val passwordHasher: PasswordHasher,
) {

    suspend fun register(req: UserRequest): UUID {

        if(req.email.isBlank()) throw BadRequest("Please enter a valid email")
        if(!req.email.contains("@")) throw BadRequest("Please enter a valid email")
        if(req.rawPassword.length < 6) throw BadRequest("Please enter Stronger password")

        val normalizedEmail = req.email.trim().lowercase()

        if(authRepository.existsByEmail(normalizedEmail)) throw Conflict("User already exists")

        val id = UUID.randomUUID()
        val passwordHash = passwordHasher.hashPassword(normalizedEmail)

        val user = req.toUserModel(id,passwordHash)

        authRepository.addUser(user)

        return id




    }
}
