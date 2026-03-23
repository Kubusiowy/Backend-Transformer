package com.example.core.config

private fun envOrNull(name: String): String? = System.getenv(name) ?: dotenv.get(name)

fun loadConfigJWT():JwtConfig {
    val audience = getEnv("JWT_AUDIENCE")
    val issuer = getEnv("JWT_ISSUER")
    val realm = getEnv("JWT_REALM")
    val secret = getEnv("JWT_SECRET")

    return JwtConfig(
        jwtAudience = audience,
        jwtIssuer = issuer,
        jwtRealm = realm,
        jwtSecret = secret
    )
}

fun loadDatabaseConfig(): DBParameters {
    val hasDbConfig = envOrNull("DB_HOST") != null || envOrNull("DB_NAME") != null
    if (hasDbConfig) return loadConfigAppDB()

    val hasMampConfig = envOrNull("MAMP_DB_HOST") != null || envOrNull("MAMP_DB_NAME") != null
    if (hasMampConfig) return loadConfigMampDB()

    return loadConfigDockerDB()
}

fun loadConfigDockerDB(): DBParameters{
    val database = getEnv("MYSQL_DATABASE")
    val user = getEnv("MYSQL_USER")
    val password = getEnv("MYSQL_PASSWORD")
    val host = envOrNull("MYSQL_HOST") ?: "db"
    return DBParameters(
        databaseName = database,
        user = user,
        password = password,
        dbHost = host,
        dbPort = getIntEnv("MYSQL_PORT")
    )

}

fun loadConfigAppDB(): DBParameters{
    val database = getEnv("DB_NAME")
    val user = getEnv("DB_USER")
    val password = getEnv("DB_PASSWORD")
    return DBParameters(
        databaseName = database,
        user = user,
        password = password,
        dbHost = getEnv("DB_HOST"),
        dbPort = getIntEnv("DB_PORT")
    )
}


fun loadConfigMampDB():DBParameters{
    val database = getEnv("MAMP_DB_NAME")
    val user = getEnv("MAMP_DB_USER")
    val password = getEnv("MAMP_DB_PASS")
    val host = getEnv("MAMP_DB_HOST")


    return DBParameters(
        databaseName = database,
        user = user,
        password = password,
        dbHost = host,
        dbPort = getIntEnv("MAMP_DB_PORT")
    )

}
