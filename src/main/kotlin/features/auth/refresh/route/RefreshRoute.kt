package com.example.features.auth.refresh.route

import com.example.features.auth.refresh.domain.DTO.request.RefreshRequest
import com.example.features.auth.refresh.domain.RefreshService
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import org.koin.ktor.ext.inject
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.common.tokenDigest

fun Route.refreshRoutes(){

    val refreshService by inject<RefreshService>()
    val authRepository by inject<AuthRepository>()

    post("/auth/logout") {
        val req = call.receive<RefreshRequest>()
        authRepository.revokeRefreshToken(tokenDigest(req.refreshToken))
        call.respond(HttpStatusCode.NoContent)
    }


        post("/auth/refresh") {
            val req = call.receive<RefreshRequest>()
            val response = refreshService.refresh(req)
            call.respond(HttpStatusCode.OK,response)
        }

}
