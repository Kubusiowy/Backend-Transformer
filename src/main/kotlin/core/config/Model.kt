package com.example.core.config

data class JwtConfig(
    val jwtAudience: String,
    val jwtIssuer: String,
    val jwtRealm: String,
    val jwtSecret:String
)

data class DBParameters(
    val databaseName:String,
    val user:String,
    val password:String,
    val dbHost:String,
    val dbPort:Int
)