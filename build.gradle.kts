val kotlin_version: String by project
val ktor_version: String by project
val logback_version: String by project
val koin_version:String by project
val exposed_core:String by project
val exposed_jdbc:String by project
val exposed_dao:String by project
val mysql_connector:String by project
val hikari_cp:String by project

val flyway_version:String by project

plugins {
    kotlin("jvm") version "2.2.21"
    id("io.ktor.plugin") version "3.3.2"
    id("org.jetbrains.kotlin.plugin.serialization") version "2.2.21"
}

group = "com.example"
version = "0.0.1"

application {
    mainClass = "io.ktor.server.netty.EngineMain"
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm")
    implementation("io.ktor:ktor-server-netty")
    implementation("ch.qos.logback:logback-classic:$logback_version")
    implementation("io.ktor:ktor-server-core")
    implementation("io.ktor:ktor-server-config-yaml")
    implementation("io.ktor:ktor-server-websockets:3.4.1")
    implementation("io.ktor:ktor-server-auth:3.4.1")
    implementation("io.ktor:ktor-server-auth-jwt:3.4.1")
    implementation("io.ktor:ktor-server-auth:3.4.1")
    implementation("io.insert-koin:koin-ktor:4.1.2-Beta1")
    implementation("io.insert-koin:koin-logger-slf4j:4.1.2-Beta1")
    implementation("io.ktor:ktor-server-call-logging:3.4.1")
    implementation("io.ktor:ktor-server-cors:3.4.1")
    implementation("io.ktor:ktor-server-host-common:3.4.1")
    implementation("io.ktor:ktor-server-status-pages:3.4.1")
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit:$kotlin_version")

    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.10.0")
    implementation("io.insert-koin:koin-ktor:${koin_version}")


    implementation("org.jetbrains.exposed:exposed-core:${exposed_core}")
    implementation("org.jetbrains.exposed:exposed-jdbc:${exposed_jdbc}")
    implementation("org.jetbrains.exposed:exposed-dao:${exposed_dao}")

    implementation("com.mysql:mysql-connector-j:${mysql_connector}")
    implementation("com.zaxxer:HikariCP:${hikari_cp}")

    implementation("io.ktor:ktor-server-content-negotiation:${ktor_version}")
    implementation("io.ktor:ktor-serialization-kotlinx-json:${ktor_version}")

    implementation("org.flywaydb:flyway-core:${flyway_version}")
    implementation("org.flywaydb:flyway-mysql:${flyway_version}")




}
