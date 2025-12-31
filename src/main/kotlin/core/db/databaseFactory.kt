package com.example.core.db

import com.example.core.config.DBParameters
import com.example.core.config.loadConfigMampDB
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Dispatchers.IO
import kotlinx.coroutines.withContext
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    private lateinit var dataSource: HikariDataSource
    private val loadCfg: DBParameters = loadConfigMampDB()


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

    }


}

suspend fun <T> dbQuery(block : () -> T): T =
    withContext(IO) {
        transaction {
            block()
        }
    }
