package com.example.features.auth.register.domain

import com.example.core.config.TenantDefaults
import com.example.core.util.PasswordHasher
import com.example.features.auth.common.data.AuthRepository
import java.time.Instant
import java.util.UUID

class RegisterService(
    private val repo: AuthRepository
) {

    suspend fun register(input: RegisterInput): UUID{
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

        return userId
    }

}