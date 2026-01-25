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

fun Route.refreshRoutes(){

    val refreshService by inject<RefreshService>()


        post("/auth/refresh") {
            val req = call.receive<RefreshRequest>()
            val response = refreshService.refresh(req)
            call.respond(HttpStatusCode.OK,response)
        }

}