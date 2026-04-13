package com.example.core.database.DI

import com.example.core.database.DatabaseFactory
import org.koin.dsl.module

val databaseModule = module{
    single { DatabaseFactory(get()) }
}