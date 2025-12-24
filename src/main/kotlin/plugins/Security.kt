package com.example.plugins

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.example.core.config.loadConfigJWT
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*



fun Application.configureSecurity() {

    val jwtConfig = loadConfigJWT()

    authentication {
        jwt {
            realm = jwtConfig.jwtRealm
            verifier(
                JWT
                    .require(Algorithm.HMAC256(jwtConfig.jwtSecret))
                    .withAudience(jwtConfig.jwtAudience)
                    .withIssuer(jwtConfig.jwtIssuer)
                    .build()
            )
            validate { credential ->
                if (credential.payload.audience.contains(jwtConfig.jwtAudience)) JWTPrincipal(credential.payload) else null
            }
        }
    }
}


