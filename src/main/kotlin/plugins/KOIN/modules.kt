package com.example.plugins.KOIN

import com.example.core.config.DBParameters
import com.example.core.config.loadConfigAppDB
import com.example.core.config.loadConfigDockerDB
import com.example.core.config.loadConfigJWT
import com.example.core.config.loadConfigMampDB
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.register.domain.RegisterService
import com.example.plugins.Security.JwtService
import com.example.plugins.Security.JwtServiceImpl
import org.koin.core.qualifier.named
import org.koin.dsl.module

val LoadCfg = module {
    single {loadConfigJWT()}
    single<DBParameters>{loadConfigMampDB()}
}

val JwtModule = module {
    single<JwtService> { JwtServiceImpl(get()) }
}

val AuthModule = module {
    single { AuthRepository() }
    single { RegisterService(get()) }
}