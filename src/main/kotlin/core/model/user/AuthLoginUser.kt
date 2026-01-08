package com.example.core.model.user

import com.example.core.model.user.Role.Role
import java.util.UUID

data class AuthLoginUser(
    val id: UUID,
    val tenantId: UUID,
    val email: String,
    val hashPassword: String,
    val role: Role,
    val isActive: Boolean

)

