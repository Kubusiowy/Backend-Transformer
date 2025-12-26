package com.example.plugins

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.example.core.config.loadConfigJWT
import com.example.plugins.Security.JwtService
import com.example.plugins.Security.JwtServiceImpl
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*



fun Application.configureSecurity(jwtService: JwtServiceImpl) {

    val jwtConfig = loadConfigJWT()

    authentication {
        jwt("auth-jwt") {
            realm = jwtConfig.jwtRealm

            verifier(jwtService.verifier())

            validate { credential ->
                if(credential.)
            }
        }
    }
}


