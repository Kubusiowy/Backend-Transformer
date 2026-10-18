package com.example

import com.example.core.config.JwtConfig
import com.example.core.db.DatabaseFactory
import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.*
import com.example.core.model.user.Role.UserRole
import com.example.features.auth.common.AuthRepository
import com.example.features.auth.common.tokenDigest
import com.example.features.IOT.metrics.data.MetricsRepository
import com.example.features.IOT.metrics.route.MetricsWsHub
import com.example.features.IOT.transformer.data.TransformerRepository
import com.example.plugins.*
import com.example.plugins.KOIN.AuthModule
import com.example.plugins.KOIN.IotModule
import com.example.plugins.Security.JwtService
import com.example.plugins.Security.JwtServiceImpl
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.client.plugins.websocket.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.config.MapApplicationConfig
import io.ktor.server.testing.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.serialization.json.*
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.deleteAll
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin
import java.time.LocalDateTime
import java.util.UUID
import kotlin.test.*

internal val testJwtConfig = JwtConfig("test-audience", "test-issuer", "test", "isolated-test-secret-never-use-in-production")

internal fun Application.isolatedModule() {
    install(Koin) {
        modules(AuthModule, IotModule, module {
            single { testJwtConfig }
            single<JwtService> { JwtServiceImpl(get()) }
        })
    }
    DatabaseFactory.init("jdbc:h2:mem:test-${UUID.randomUUID()};MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1")
    monitor.subscribe(ApplicationStopped) { DatabaseFactory.close() }
    configureSerialization()
    configureStatusPage()
    configureWebSockets()
    configureSecurity()
    configureRouting()
}

class ApplicationTest {
    private fun checkApp(block: suspend ApplicationTestBuilder.() -> Unit) = testApplication {
        environment { config = MapApplicationConfig() }
        application { isolatedModule() }
        block()
    }

    private suspend fun HttpClient.json(method: HttpMethod, path: String, body: String? = null, token: String? = null) = request(path) {
        this.method = method
        contentType(ContentType.Application.Json)
        if (token != null) bearerAuth(token)
        if (body != null) setBody(body)
    }
    private suspend fun HttpResponse.obj() = Json.parseToJsonElement(bodyAsText()).jsonObject
    private suspend fun HttpClient.account(email: String = "user@example.test"): JsonObject {
        assertEquals(HttpStatusCode.Created, json(HttpMethod.Post, "/auth/register", """{"email":"$email","rawPassword":"testPassword123"}""").status)
        val response = json(HttpMethod.Post, "/auth/login", """{"email":"$email","rawPassword":"testPassword123"}""")
        assertEquals(HttpStatusCode.OK, response.status)
        return response.obj()
    }
    private fun JsonObject.str(key: String) = getValue(key).jsonPrimitive.content
    private suspend fun HttpClient.transformer(token: String): String = json(HttpMethod.Post, "/transformers", """{"name":"Station"}""", token).obj().str("id")

    @Test fun `static pages and local bootstrap are served`() = checkApp {
        val noRedirect = createClient { followRedirects = false }
        assertEquals(HttpStatusCode.Found, noRedirect.get("/").status)
        for (page in listOf("index", "panel", "transformers", "meters", "registers", "readings", "readings-charts", "readings-diagnostics", "profile", "admin")) {
            val response = client.get("/static/$page.html")
            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(response.bodyAsText(), "vendor/bootstrap.min.css")
        }
        assertEquals(HttpStatusCode.OK, client.get("/static/vendor/bootstrap.min.css").status)
    }

    @Test fun `authentication and refresh reject invalid and wrong-purpose tokens`() = checkApp {
        assertEquals(HttpStatusCode.Unauthorized, client.get("/transformers").status)
        val user = client.account()
        val access = user.str("accessToken")
        val refresh = user.str("refreshToken")
        assertEquals(HttpStatusCode.OK, client.json(HttpMethod.Get, "/me", token = access).status)
        assertEquals(HttpStatusCode.Unauthorized, client.json(HttpMethod.Get, "/me", token = refresh).status)
        for (invalid in listOf("broken", access)) {
            assertEquals(HttpStatusCode.Unauthorized, client.json(HttpMethod.Post, "/auth/refresh", """{"refreshToken":"$invalid"}""").status)
        }
        assertEquals(HttpStatusCode.OK, client.json(HttpMethod.Post, "/auth/refresh", """{"refreshToken":"$refresh"}""").status)
        val notStored = JwtServiceImpl(testJwtConfig).generateRefreshToken(UUID.fromString(user.str("id")))
        assertEquals(HttpStatusCode.Unauthorized, client.json(HttpMethod.Post, "/auth/refresh", """{"refreshToken":"$notStored"}""").status)
        assertNotEquals(tokenDigest(refresh), tokenDigest(notStored))
    }

    @Test fun `users cannot access another installation or admin API`() = checkApp {
        val owner = client.account().str("accessToken")
        val stranger = client.account("other@example.test").str("accessToken")
        val id = client.transformer(owner)
        for (path in listOf("/transformers/$id", "/transformers/$id/meters", "/transformers/$id/errors", "/transformers/$id/metrics?key=x", "/transformers/$id/metrics?key=x&resolution=samples")) {
            assertEquals(HttpStatusCode.Forbidden, client.json(HttpMethod.Get, path, token = stranger).status)
        }
        assertEquals(HttpStatusCode.Forbidden, client.json(HttpMethod.Delete, "/transformers/$id", token = stranger).status)
        assertEquals(HttpStatusCode.Forbidden, client.json(HttpMethod.Get, "/admin/users", token = owner).status)
    }

    @Test fun `invalid input is rejected and duplicate records return conflict`() = checkApp {
        val user = client.account()
        val token = user.str("accessToken")
        assertEquals(HttpStatusCode.Conflict, client.json(HttpMethod.Post, "/auth/register", """{"email":"user@example.test","rawPassword":"testPassword123"}""").status)
        assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Post, "/transformers", "{broken", token).status)
        assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Post, "/transformers", """{"name":"${"x".repeat(121)}"}""", token).status)
        val id = client.transformer(token)
        for (payload in listOf("""{"key":"x","value":1,"timestamp":"invalid"}""", """{"key":"${"x".repeat(65)}","value":1}""")) {
            assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Post, "/transformers/$id/metrics", payload, token).status)
        }
        assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Get, "/transformers/$id/metrics?key=x&from=2026-01-02T00:00:00&to=2026-01-01T00:00:00", token = token).status)
    }

    @Test fun `concurrent samples preserve count average and unique keys`() = checkApp {
        val token = client.account().str("accessToken")
        val id = UUID.fromString(client.transformer(token))
        val repo = MetricsRepository()
        val time = LocalDateTime.of(2026, 1, 1, 0, 0)
        coroutineScope {
            (1..40).map { value -> async { repo.upsertValue(id, "voltage", time, value.toDouble(), "V", null) } }.awaitAll()
        }
        repo.upsertValue(id, "voltage", time.plusMinutes(1), 240.0, "V", null)
        val first = repo.list(id, "voltage", 10, null, null, true).first()
        assertEquals(40, first.count)
        assertEquals(20.5, first.avgValue!!, 0.000001)
        assertEquals(1.0, first.minValue)
        assertEquals(40.0, first.maxValue)
        assertEquals(listOf("voltage"), repo.listKeys(id))
        assertEquals(41, repo.list(id, "voltage", 100, null, null, true, samples = true).size)
    }

    @Test fun `chart history preserves individual readings and their times within one minute`() = checkApp {
        val token = client.account().str("accessToken")
        val id = client.transformer(token)
        val path = "/transformers/$id/metrics"
        for ((second, value) in listOf(45 to 240, 5 to 220, 15 to 230)) {
            val timestamp = "2026-01-01T00:00:${second.toString().padStart(2, '0')}.125Z"
            val response = client.json(HttpMethod.Post, path, """{"key":"x","value":$value,"timestamp":"$timestamp"}""", token)
            assertEquals(HttpStatusCode.Created, response.status)
            assertEquals(timestamp, response.obj().str("timestamp"))
        }
        suspend fun history(query: String) = Json.parseToJsonElement(client.json(HttpMethod.Get,
            "$path?key=x&$query", token = token).bodyAsText()).jsonArray.map { it.jsonObject }
        val points = history("resolution=samples&order=asc")
        assertEquals(listOf(220.0, 230.0, 240.0), points.map { it["lastValue"]!!.jsonPrimitive.double })
        assertEquals(3, points.map { it.str("sampleId") }.toSet().size)
        assertEquals(listOf(1, 1, 1), points.map { it["count"]!!.jsonPrimitive.int })
        assertEquals(points.reversed().take(2), history("resolution=samples&order=desc&limit=2"))
        assertEquals(listOf(points[1]), history("resolution=samples&from=2026-01-01T00:00:10Z&to=2026-01-01T00:00:20Z"))
        assertEquals(3, history("order=desc").single()["count"]!!.jsonPrimitive.int)
        assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Get, "$path?key=x&resolution=invalid", token = token).status)
    }

    @Test fun `sample history retains legacy minute data without duplicate aggregate points`() = checkApp {
        val token = client.account().str("accessToken")
        val id = UUID.fromString(client.transformer(token))
        val repo = MetricsRepository()
        val minute = LocalDateTime.of(2026, 1, 1, 0, 0)
        repo.upsertValue(id, "x", minute, 10.0, null, null)
        dbQuery { MetricSamples.deleteAll() } // Simulate a minute stored before sample history existed.
        repo.upsertValue(id, "x", minute.plusMinutes(1), 20.0, null, null, minute.plusMinutes(1).plusSeconds(5))
        repo.upsertValue(id, "x", minute.plusMinutes(1), 30.0, null, null, minute.plusMinutes(1).plusSeconds(15))
        val points = repo.list(id, "x", 10, null, null, true, samples = true)
        assertEquals(listOf(10.0, 20.0, 30.0), points.map { it.lastValue })
        assertNull(points.first().sampleId)
        assertTrue(points.drop(1).all { it.timestamp != null })
        assertEquals(listOf(30.0, 20.0), repo.list(id, "x", 2, null, null, false, samples = true).map { it.lastValue })
        // At an exact minute boundary, sampled aggregates must not hide older legacy data.
        repo.upsertValue(id, "x", minute.plusMinutes(2), 40.0, null, null)
        val older = repo.list(id, "x", 3, null, null, false, samples = true,
            before = minute.plusMinutes(2), beforeSequence = 1)
        assertEquals(listOf(30.0, 20.0, 10.0), older.map { it.lastValue })
        assertEquals(listOf(10.0), repo.list(id, "x", 1, null, null, false, samples = true,
            before = minute.plusMinutes(1).plusSeconds(5), beforeSequence = 1).map { it.lastValue })
    }

    @Test fun `history cursor pages to the start without losing samples sharing a timestamp`() = checkApp {
        val token = client.account().str("accessToken")
        val id = client.transformer(token)
        val repo = MetricsRepository()
        val start = LocalDateTime.of(2026, 1, 1, 0, 0)
        for (index in 0..8) {
            val time = start.plusMinutes((index / 3).toLong())
            repo.upsertValue(UUID.fromString(id), "x", time, index.toDouble(), null, null, time.plusSeconds(5))
        }
        val values = mutableListOf<Double>()
        var cursor = ""
        repeat(5) {
            val response = client.json(HttpMethod.Get,
                "/transformers/$id/metrics?key=x&resolution=samples&order=desc&limit=2$cursor", token = token)
            assertEquals(HttpStatusCode.OK, response.status)
            val points = Json.parseToJsonElement(response.bodyAsText()).jsonArray.map { it.jsonObject }
            values.addAll(points.map { it["lastValue"]!!.jsonPrimitive.double })
            val last = points.last()
            cursor = "&before=${last.str("timestamp")}&beforeSequence=${last.str("sampleId").substringAfterLast('#')}"
        }
        assertEquals((8 downTo 0).map { it.toDouble() }, values)
        for (invalid in listOf("before=bad", "beforeSequence=-1", "beforeSequence=2",
            "before=2026-01-01T00:00:00Z&order=asc")) {
            assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Get,
                "/transformers/$id/metrics?key=x&$invalid", token = token).status)
        }
    }

    @Test fun `websocket rejects bad auth and foreign installations`() = checkApp {
        val owner = client.account().str("accessToken")
        val id = client.transformer(owner)
        val stranger = client.account("other@example.test").str("accessToken")
        val wsClient = createClient { install(WebSockets) }
        for (token in listOf("invalid", stranger)) {
            wsClient.webSocket("/ws/transformers/$id/metrics") {
                send("""{"type":"auth","token":"$token"}""")
                assertEquals(1008, withTimeout(5000) { closeReason.await() }?.code?.toInt())
            }
        }
    }

    @Test fun `websocket survives bad frames and receives HTTP and WS updates`() = checkApp {
        val token = client.account().str("accessToken")
        val id = client.transformer(token)
        val http = client
        val wsClient = createClient { install(WebSockets) }
        wsClient.webSocket("/ws/transformers/$id/metrics") {
            suspend fun next() = Json.parseToJsonElement((withTimeout(5000) { incoming.receive() } as Frame.Text).readText()).jsonObject
            send("""{"type":"auth","token":"$token"}""")
            assertEquals("ready", next().str("type"))
            for (frame in listOf("not json", """{"key":"x","value":1,"timestamp":"bad"}""", """{"key":"${"x".repeat(65)}","value":1}""")) {
                send(frame)
                assertEquals("error", next().str("type"))
            }
            send("""{"key":"x","value":10,"timestamp":"2026-01-01T00:00:00Z"}""")
            assertEquals(1, next()["count"]?.jsonPrimitive?.int)
            val response = http.json(HttpMethod.Post, "/transformers/$id/metrics", """{"key":"x","value":20,"timestamp":"2026-01-01T00:00:30Z"}""", token)
            assertEquals(HttpStatusCode.Created, response.status)
            val point = next()
            assertEquals(2, point["count"]?.jsonPrimitive?.int)
            assertEquals(15.0, point["avgValue"]?.jsonPrimitive?.double)
            assertEquals("2026-01-01T00:00:30Z", point.str("timestamp"))
            val history = Json.parseToJsonElement(http.json(HttpMethod.Get,
                "/transformers/$id/metrics?key=x&resolution=samples", token = token).bodyAsText()).jsonArray
            assertEquals(2, history.size)
            assertEquals(point.str("sampleId"), history.last().jsonObject.str("sampleId"))
            close()
        }
    }

    @Test fun `slow websocket consumers do not block healthy subscribers`() = runBlocking {
        val id = UUID.randomUUID()
        val slow = MetricsWsHub.add(id)
        val healthy = MetricsWsHub.add(id)
        repeat(100) {
            MetricsWsHub.broadcast(id, it.toString())
            assertEquals(it.toString(), withTimeout(1000) { healthy.receive() })
        }
        repeat(64) { slow.receive() }
        assertTrue(slow.receiveCatching().isClosed)
        MetricsWsHub.remove(id, healthy)
        val next = MetricsWsHub.add(id)
        MetricsWsHub.remove(id, slow)
        MetricsWsHub.broadcast(id, "still subscribed")
        assertEquals("still subscribed", next.receive())
        MetricsWsHub.remove(id, next)
    }

    @Test fun `deleting users removes installations and refresh sessions atomically`() = checkApp {
        val user = client.account()
        val token = user.str("accessToken")
        val id = client.transformer(token)
        val meter = client.json(HttpMethod.Post, "/transformers/$id/meters", """{"name":"Meter","deviceCode":"meter-1","serialPort":"COM1","baudRate":9600,"slaveId":1}""", token)
        assertEquals(HttpStatusCode.Created, meter.status)
        val meterId = meter.obj()["id"]!!.jsonPrimitive.long
        assertEquals(HttpStatusCode.Created, client.json(HttpMethod.Post, "/meters/$meterId/registers", """{"name":"Voltage","address":1,"dataType":"FLOAT32"}""", token).status)
        assertEquals(HttpStatusCode.Created, client.json(HttpMethod.Post, "/transformers/$id/metrics", """{"key":"x","value":1}""", token).status)
        AuthRepository().deleteById(UUID.fromString(user.str("id")))
        dbQuery {
            for (table in listOf(Users, RefreshSessions, Transformers, Meter, MeterRegister, Metrics1mKv, MetricSamples)) assertEquals(0L, table.selectAll().count(), table.tableName)
        }
        assertEquals(HttpStatusCode.Unauthorized, client.json(HttpMethod.Get, "/me", token = token).status)
    }

    @Test fun `role changes apply to already issued access tokens`() = checkApp {
        val user = client.account()
        val id = UUID.fromString(user.str("id"))
        val repo = AuthRepository()
        repo.updateRole(id, UserRole.ADMIN)
        val adminToken = JwtServiceImpl(testJwtConfig).generateAccessToken(id, UserRole.ADMIN)
        assertEquals(HttpStatusCode.OK, client.json(HttpMethod.Get, "/admin/users", token = adminToken).status)
        repo.updateRole(id, UserRole.USER)
        assertEquals(HttpStatusCode.Forbidden, client.json(HttpMethod.Get, "/admin/users", token = adminToken).status)
    }

    @Test fun `logout revokes only the submitted refresh token`() = checkApp {
        val user = client.account()
        val refresh = user.str("refreshToken")
        val other = client.json(HttpMethod.Post, "/auth/login", """{"email":"user@example.test","rawPassword":"testPassword123"}""").obj().str("refreshToken")
        assertEquals(HttpStatusCode.NoContent, client.json(HttpMethod.Post, "/auth/logout", """{"refreshToken":"$refresh"}""").status)
        assertEquals(HttpStatusCode.Unauthorized, client.json(HttpMethod.Post, "/auth/refresh", """{"refreshToken":"$refresh"}""").status)
        assertEquals(HttpStatusCode.OK, client.json(HttpMethod.Post, "/auth/refresh", """{"refreshToken":"$other"}""").status)
    }

    @Test fun `meter and register validation rejects unsafe configuration`() = checkApp {
        val token = client.account().str("accessToken")
        val id = client.transformer(token)
        val invalid = """{"name":"Meter","deviceCode":"meter-1","serialPort":"COM1","baudRate":0,"slaveId":1}"""
        assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Post, "/transformers/$id/meters", invalid, token).status)
        val valid = invalid.replace("\"baudRate\":0", "\"baudRate\":9600")
        val meter = client.json(HttpMethod.Post, "/transformers/$id/meters", valid, token).obj().str("id")
        assertEquals(HttpStatusCode.Conflict, client.json(HttpMethod.Post, "/transformers/$id/meters", valid, token).status)
        for (body in listOf("""{"name":"x","address":65535,"dataType":"FLOAT32"}""", """{"name":"x","address":0,"length":1,"dataType":"FLOAT32"}""")) {
            assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Post, "/meters/$meter/registers", body, token).status)
        }
        assertEquals(HttpStatusCode.BadRequest, client.json(HttpMethod.Put, "/transformers/$id/meters/$meter", """{"pollIntervalMs":0}""", token).status)
    }
}
