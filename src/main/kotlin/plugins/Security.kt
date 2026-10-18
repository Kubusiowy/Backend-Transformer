package com.example.plugins

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.example.core.config.loadConfigJWT
import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.jwt.UserPrincipal
import com.example.plugins.Security.JwtService
import com.example.features.auth.common.AuthRepository
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import org.koin.ktor.ext.inject
import java.util.UUID



fun Application.configureSecurity() {

    val jwtService by inject<JwtService>()
    val authRepo by inject<AuthRepository>()

    val jwtConfig by inject<com.example.core.config.JwtConfig>()

    authentication {
        jwt("auth-jwt") {
            realm = jwtConfig.jwtRealm

            verifier(jwtService.verifier())

            validate { credential ->
                if (credential.payload.getClaim("type").asString() != "access") return@validate null
                val subjectValue = credential.payload.subject
                if (subjectValue.isNullOrBlank()) return@validate null
                val subject = runCatching { UUID.fromString(subjectValue)}.getOrNull() ?: return@validate null

                val roleValue = credential.payload.getClaim("role")?.asString()
                if (roleValue.isNullOrBlank()) return@validate null
                val role = runCatching { UserRole.valueOf(roleValue) }.getOrNull()
                    ?: return@validate null

                val user = authRepo.findById(subject) ?: return@validate null
                UserPrincipal(subject, user.role)
            }
        }
    }
}
