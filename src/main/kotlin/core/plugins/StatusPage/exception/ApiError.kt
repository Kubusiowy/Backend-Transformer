package com.example.core.plugins.StatusPage.exception

import io.ktor.http.HttpStatusCode

open class ApiError(val status: HttpStatusCode,
                    override val message:String)
    :RuntimeException(message)