package com.example.core.config

import io.github.cdimascio.dotenv.dotenv


val dotenv = dotenv {
    directory = "./"
    ignoreIfMissing = false
}

fun getEnv(name:String):String{
    return dotenv.get(name)?: error("Environment variable $name is missing")
}

fun getIntEnv(name:String):Int{
    val env = dotenv.get(name)
    return env.toIntOrNull() ?: error("Environment variable $name must be an integer, but was: $env")
}