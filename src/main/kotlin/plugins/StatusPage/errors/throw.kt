package com.example.plugins.StatusPage.errors

import com.example.plugins.StatusPage.exception.ApiError
import io.ktor.http.HttpStatusCode

class BadRequest(message:String): ApiError(HttpStatusCode.BadRequest,message)
class Conflict(message:String): ApiError(HttpStatusCode.Conflict,message)
