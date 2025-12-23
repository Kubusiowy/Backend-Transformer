package com.example.plugins

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

data class JwtConfig(
    val jwtAudience: String,
    val jwtIssuer: String,
    val jwtRealm: String,
    val jwtSecret:String
)

fun Application.configureSecurity() {

    val jwtConfig = loadConfig()

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

private fun loadConfig():JwtConfig {
    val audience = System.getenv("JWT_AUDIENCE")?: error("JWT_AUDIENCE env variable is not set")
    val issuer = System.getenv("JWT_ISSUER") ?: error("JWT_ISSUER env variable is not set")
    val realm = System.getenv("JWT_REALM") ?: error("JWT_REALM env variable is not set")
    val secret = System.getenv("JWT_SECRET") ?: error("JWT_SECRET env variable is not set")

    return JwtConfig(
        jwtAudience = audience,
        jwtIssuer = issuer,
        jwtRealm = realm,
        jwtSecret = secret
    )
}
