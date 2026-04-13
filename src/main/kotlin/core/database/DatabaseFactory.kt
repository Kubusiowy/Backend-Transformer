package com.example.core.database

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.config.ApplicationConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import javax.sql.DataSource

class DatabaseFactory(
    private val config: ApplicationConfig
) {

    lateinit var dataSource: HikariDataSource


    fun init(){

        val host = config.property("database.host").getString()
        val port = config.property("database.port").getString()
        val databaseName = config.property("database.name").getString()
        val username = config.property("database.user").getString()
        val password = config.property("database.pass").getString()

        val configHikari = HikariConfig().apply {
          jdbcUrl = "jdbc:mysql://${host}:${port}/${databaseName}"
            driverClassName = "com.mysql.cj.jdbc.Driver"
            this.username = username
            this.password = password

        }

        dataSource = HikariDataSource(configHikari)
        runMigration(dataSource)
        Database.connect(dataSource)

    }

    private fun runMigration(dataSource: DataSource){
        Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/migrations")
            .load()
            .migrate()
    }
}

suspend fun <T> dbQuery(block: () -> T): T = withContext(Dispatchers.IO) {
    transaction { block() }
}