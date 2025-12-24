package com.example.core.config

fun getEnv(name:String):String{
    return System.getenv(name)?: error("Environment variable $name is missing")
}

fun getIntEnv(name:String):Int{
    val env = getEnv(name)
    return env.toIntOrNull() ?: error("Environment variable $name is missing")
}