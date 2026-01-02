package com.example.core.model.user.jwt

import com.example.core.model.user.Role.Role
import io.ktor.server.auth.Principal
import java.util.UUID

data class UserPrincipal(
    val subject: UUID,
    val role: Role
): Principal