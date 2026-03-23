package com.example.core.db

import com.example.core.config.DBParameters
import com.example.core.db.exposedTables.DeviceApiKeys
import com.example.core.db.exposedTables.Meter
import com.example.core.db.exposedTables.MeterRegister
import com.example.core.db.exposedTables.Metrics1mKv
import com.example.core.db.exposedTables.RefreshSessions
import com.example.core.db.exposedTables.TransformerErrors
import com.example.core.db.exposedTables.Transformers
import com.example.core.db.exposedTables.Users
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.Dispatchers.IO
import kotlinx.coroutines.withContext
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject


object DatabaseFactory: KoinComponent {
    private lateinit var dataSource: HikariDataSource
    private val loadCfg: DBParameters by inject()


    fun init(){
        val config = HikariConfig().apply{
            jdbcUrl = "jdbc:mysql://${loadCfg.dbHost}:${loadCfg.dbPort}/${loadCfg.databaseName}"
            driverClassName = "com.mysql.cj.jdbc.Driver"
            username = loadCfg.user
            password = loadCfg.password
            maximumPoolSize = 15
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }

        dataSource = HikariDataSource(config)
        Database.connect(dataSource)
        transaction {
            SchemaUtils.createMissingTablesAndColumns(
                Users,
                RefreshSessions,
                Transformers,
                TransformerErrors,
                Meter,
                MeterRegister,
                Metrics1mKv,
                DeviceApiKeys
            )
        }

    }


}

suspend fun <T> dbQuery(block : () -> T): T =
    withContext(IO) {
        transaction {
            block()
        }
    }
