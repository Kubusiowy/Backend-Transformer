package com.example.plugins.KOIN

import com.example.core.config.DBParameters
import com.example.core.config.loadConfigJWT
import com.example.core.config.loadConfigMampDB
import com.example.core.util.passHash.Hasher
import com.example.core.util.passHash.HasherIMPL
import com.example.features.common.AuthRepository
import com.example.features.auth.login.domain.LoginService
import com.example.features.auth.refresh.domain.RefreshService
import com.example.features.auth.register.domain.RegisterService
import com.example.plugins.Security.JwtService
import com.example.plugins.Security.JwtServiceImpl
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
    single<Hasher> { HasherIMPL }

    single { RegisterService(get(), get()) }
    single { LoginService(get(), get(),get()) }

    single { RefreshService(get(), get(), get()) }
}
