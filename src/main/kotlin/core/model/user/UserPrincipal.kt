package com.example.core.model.user

import com.example.core.model.user.Role.Role
import java.util.UUID

data class UserPrincipal(
    val subject: UUID,
    val role: Role
)
