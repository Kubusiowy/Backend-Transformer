package com.example.plugins

import com.example.plugins.StatusPage.errors.ErrorResponse
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.application.log
import io.ktor.server.plugins.ContentTransformationException
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.request.path
import io.ktor.server.response.respond

fun Application.configureStatusPage() {
    install(StatusPages) {

        status(HttpStatusCode.NotFound) { call, code ->
            call.respond(
                status = code,
                message = ErrorResponse(
                    isSuccess = false,
                    message = "${call.request.path()} not found",
                    code = code.value,
                    path = call.request.path()
                )
            )
        }

        exception<ContentTransformationException> { call, _ ->
            call.respond(
                status = HttpStatusCode.BadRequest,
                message = ErrorResponse(
                    isSuccess = false,
                    message = "Invalid request body",
                    code = HttpStatusCode.BadRequest.value,
                    path = call.request.path()
                )
            )
        }

        exception<IllegalArgumentException> { call, cause ->
            call.respond(
                status = HttpStatusCode.BadRequest,
                message = ErrorResponse(
                    isSuccess = false,
                    message = cause.message ?: "Bad request",
                    code = HttpStatusCode.BadRequest.value,
                    path = call.request.path()
                )
            )
        }

        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled error for ${call.request.path()}", cause)
            call.respond(
                status = HttpStatusCode.InternalServerError,
                message = ErrorResponse(
                    isSuccess = false,
                    message = "Internal server error",
                    code = HttpStatusCode.InternalServerError.value,
                    path = call.request.path()
                )
            )
        }
    }
}
