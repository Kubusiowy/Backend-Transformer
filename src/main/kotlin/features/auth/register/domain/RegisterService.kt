package com.example.features.auth.register.domain

import com.example.core.config.TenantDefaults
import com.example.core.util.PasswordHasher
import com.example.features.auth.common.AuthRepository
import java.time.Instant
import java.util.UUID

class RegisterService(
    private val repo: AuthRepository
) {

    suspend fun register(input: RegisterInput): RegisterResult {

        if(input.email.isBlank()) return RegisterResult.Failure("email is blank")
        if(input.username.isBlank()) return RegisterResult.Failure("username is blank")
        if(input.surname.isBlank()) return RegisterResult.Failure("surname is blank")
        if(input.rawPassword.isBlank() || input.rawPassword.length < 8) return RegisterResult.Failure("raw password is blank or too short")

        val userId = UUID.randomUUID()
        val tenantId = TenantDefaults.DEFAULT_TENANT_ID
        val now = Instant.now()

        val passwordHash = PasswordHasher.hash(input.rawPassword)

        repo.createNewUser(
            userId,
            tenantId,
            input.email,
            input.username,
            input.surname,
            passwordHash,
            now
        )

        return RegisterResult.Success(userId)
    }

}