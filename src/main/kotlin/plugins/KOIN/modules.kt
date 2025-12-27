package com.example.plugins.KOIN

import com.example.core.config.loadConfigJWT
import com.example.plugins.Security.JwtService
import com.example.plugins.Security.JwtServiceImpl
import org.koin.dsl.module

val configModule = module{
    single {loadConfigJWT()}
}

val appModule = module{
    single <JwtService> { JwtServiceImpl(get()) }
}