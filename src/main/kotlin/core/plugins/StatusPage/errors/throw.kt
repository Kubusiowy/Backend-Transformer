package com.example.core.plugins.StatusPage.errors

import com.example.core.plugins.StatusPage.exception.ApiError
import io.ktor.http.HttpStatusCode

class BadRequest(message:String): ApiError(HttpStatusCode.BadRequest,message)
class Conflict(message:String): ApiError(HttpStatusCode.Conflict,message)
class Unauthorized(message:String): ApiError(HttpStatusCode.Unauthorized,message)
class Forbidden(message:String): ApiError(HttpStatusCode.Forbidden,message)
class NotFound(message:String): ApiError(HttpStatusCode.NotFound,message)
