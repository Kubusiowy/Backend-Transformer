package com.example.core.config

import io.github.cdimascio.dotenv.dotenv


val dotenv = dotenv {
    directory = "./"
    // In containers values come from process env; .env file may not exist.
    ignoreIfMissing = true
}

fun getEnv(name:String):String{
    return System.getenv(name) ?: dotenv.get(name) ?: error("Environment variable $name is missing")
}

fun getIntEnv(name:String):Int{
    val env = System.getenv(name) ?: dotenv.get(name)
    return env.toIntOrNull() ?: error("Environment variable $name must be an integer, but was: $env")
}
