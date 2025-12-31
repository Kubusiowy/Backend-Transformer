package com.example.plugins.KOIN

import com.example.core.config.loadConfigAppDB
import com.example.core.config.loadConfigDockerDB
import com.example.core.config.loadConfigJWT
import com.example.core.config.loadConfigMampDB
import com.example.features.auth.repo.AuthRepository
import com.example.features.auth.service.AuthService
import com.example.plugins.Security.JwtService
import com.example.plugins.Security.JwtServiceImpl
import org.koin.core.qualifier.named
import org.koin.dsl.module


val loadCfgModule = module{
    single(named("jwt")) { loadConfigJWT() }
    single(named("db-app")) { loadConfigAppDB() }
    single(named("db-mamp")) { loadConfigMampDB() }
    single(named("db-docker")) { loadConfigDockerDB() }
}

val securityModule = module {
    single<JwtService>{JwtServiceImpl(get(named("jwt")))}

}

val authModule = module {
    single{ AuthRepository() }
    single { AuthService(get(), get()) }
}