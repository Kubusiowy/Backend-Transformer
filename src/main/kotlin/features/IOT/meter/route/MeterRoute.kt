package com.example.features.IOT.meter.route

import com.example.core.model.user.Role.UserRole
import com.example.core.model.user.jwt.UserPrincipal
import com.example.features.IOT.meter.data.MeterRepository
import com.example.features.IOT.meter.domain.DTO.request.MeterCreateRequest
import com.example.features.IOT.meter.domain.DTO.request.MeterUpdateRequest
import com.example.features.IOT.meter.domain.DTO.request.RegisterCreateRequest
import com.example.features.IOT.meter.domain.DTO.request.RegisterUpdateRequest
import com.example.features.IOT.meter.domain.DTO.response.MeterResponse
import com.example.features.IOT.meter.domain.DTO.response.RegisterResponse
import com.example.features.IOT.transformer.data.TransformerRepository
import com.example.plugins.StatusPage.errors.BadRequest
import com.example.plugins.StatusPage.errors.Forbidden
import com.example.plugins.StatusPage.errors.NotFound
import com.example.plugins.StatusPage.errors.Unauthorized
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import org.koin.ktor.ext.inject
import java.util.UUID

fun Route.meterRoute() {
    val meterRepo: MeterRepository by inject()
    val transformerRepo: TransformerRepository by inject()

    fun getPrincipal(call: ApplicationCall): UserPrincipal =
        call.principal<UserPrincipal>() ?: throw Unauthorized("Unauthorized")

    suspend fun requireTransformerAccess(transformerId: UUID, principal: UserPrincipal): TransformerRepository.TransformerRecord {
        val transformer = transformerRepo.findById(transformerId) ?: throw NotFound("Transformer not found")
        if (principal.role != UserRole.ADMIN && transformer.userId != principal.subject) {
            throw Forbidden("Brak dostepu do transformatora")
        }
        return transformer
    }

    fun MeterRepository.MeterRecord.toResponse() = MeterResponse(
        id = id,
        transformerId = transformerId,
        name = name,
        deviceCode = deviceCode,
        enabled = enabled,
        serialPort = serialPort,
        baudRate = baudRate,
        parity = parity,
        stopBits = stopBits,
        slaveId = slaveId,
        pollIntervalMs = pollIntervalMs
    )

    fun MeterRepository.RegisterRecord.toResponse() = RegisterResponse(
        id = id,
        meterId = meterId,
        name = name,
        registerType = registerType,
        address = address,
        length = length,
        dataType = dataType,
        scale = scale,
        unit = unit,
        enabled = enabled,
        orderIndex = orderIndex
    )

    route("/transformers/{transformerId}/meters") {
        get {
            val principal = getPrincipal(call)
            val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid transformer id")
            requireTransformerAccess(transformerId, principal)
            val meters = meterRepo.listByTransformer(transformerId).map { it.toResponse() }
            call.respond(HttpStatusCode.OK, meters)
        }

        post {
            val principal = getPrincipal(call)
            val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid transformer id")
            requireTransformerAccess(transformerId, principal)
            val req = call.receive<MeterCreateRequest>()
            if (req.name.isBlank()) throw BadRequest("Name is required")
            val created = meterRepo.create(
                transformerId = transformerId,
                name = req.name.trim(),
                deviceCode = req.deviceCode.trim(),
                enabled = req.enabled,
                serialPort = req.serialPort.trim(),
                baudRate = req.baudRate,
                parity = req.parity,
                stopBits = req.stopBits,
                slaveId = req.slaveId,
                pollIntervalMs = req.pollIntervalMs,
            )
            call.respond(HttpStatusCode.Created, created.toResponse())
        }
    }

    route("/transformers/{transformerId}/meters/{meterId}") {
        get {
            val principal = getPrincipal(call)
            val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid transformer id")
            val meterId = call.parameters["meterId"]?.toLongOrNull() ?: throw BadRequest("Invalid meter id")
            requireTransformerAccess(transformerId, principal)
            val meter = meterRepo.findById(meterId) ?: throw NotFound("Meter not found")
            if (meter.transformerId != transformerId) {
                throw NotFound("Meter not found")
            }
            call.respond(HttpStatusCode.OK, meter.toResponse())
        }

        put {
            val principal = getPrincipal(call)
            val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid transformer id")
            val meterId = call.parameters["meterId"]?.toLongOrNull() ?: throw BadRequest("Invalid meter id")
            requireTransformerAccess(transformerId, principal)
            val existing = meterRepo.findById(meterId) ?: throw NotFound("Meter not found")
            if (existing.transformerId != transformerId) {
                throw NotFound("Meter not found")
            }
            val req = call.receive<MeterUpdateRequest>()
            val updated = existing.copy(
                name = req.name?.trim()?.takeIf { it.isNotBlank() } ?: existing.name,
                deviceCode = req.deviceCode?.trim()?.takeIf { it.isNotBlank() } ?: existing.deviceCode,
                enabled = req.enabled ?: existing.enabled,
                serialPort = req.serialPort?.trim()?.takeIf { it.isNotBlank() } ?: existing.serialPort,
                baudRate = req.baudRate ?: existing.baudRate,
                parity = req.parity ?: existing.parity,
                stopBits = req.stopBits ?: existing.stopBits,
                slaveId = req.slaveId ?: existing.slaveId,
                pollIntervalMs = req.pollIntervalMs ?: existing.pollIntervalMs,
            )
            meterRepo.update(meterId, updated)
            call.respond(HttpStatusCode.OK, updated.toResponse())
        }

        delete {
            val principal = getPrincipal(call)
            val transformerId = call.parameters["transformerId"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                ?: throw BadRequest("Invalid transformer id")
            val meterId = call.parameters["meterId"]?.toLongOrNull() ?: throw BadRequest("Invalid meter id")
            requireTransformerAccess(transformerId, principal)
            val existing = meterRepo.findById(meterId) ?: throw NotFound("Meter not found")
            if (existing.transformerId != transformerId) {
                throw NotFound("Meter not found")
            }
            meterRepo.delete(meterId)
            call.respond(HttpStatusCode.NoContent)
        }
    }

    route("/meters/{meterId}/registers") {
        get {
            val principal = getPrincipal(call)
            val meterId = call.parameters["meterId"]?.toLongOrNull() ?: throw BadRequest("Invalid meter id")
            val meter = meterRepo.findById(meterId) ?: throw NotFound("Meter not found")
            requireTransformerAccess(meter.transformerId, principal)
            val registers = meterRepo.listRegisters(meterId).map { it.toResponse() }
            call.respond(HttpStatusCode.OK, registers)
        }

        post {
            val principal = getPrincipal(call)
            val meterId = call.parameters["meterId"]?.toLongOrNull() ?: throw BadRequest("Invalid meter id")
            val meter = meterRepo.findById(meterId) ?: throw NotFound("Meter not found")
            requireTransformerAccess(meter.transformerId, principal)
            val req = call.receive<RegisterCreateRequest>()
            val created = meterRepo.createRegister(
                meterId = meterId,
                name = req.name.trim(),
                registerType = req.registerType,
                address = req.address,
                length = req.length,
                dataType = req.dataType,
                scale = req.scale,
                unit = req.unit,
                enabled = req.enabled,
                orderIndex = req.orderIndex,
            )
            call.respond(HttpStatusCode.Created, created.toResponse())
        }
    }

    route("/meters/{meterId}/registers/{registerId}") {
        get {
            val principal = getPrincipal(call)
            val meterId = call.parameters["meterId"]?.toLongOrNull() ?: throw BadRequest("Invalid meter id")
            val registerId = call.parameters["registerId"]?.toLongOrNull() ?: throw BadRequest("Invalid register id")
            val meter = meterRepo.findById(meterId) ?: throw NotFound("Meter not found")
            requireTransformerAccess(meter.transformerId, principal)
            val register = meterRepo.findRegisterById(registerId) ?: throw NotFound("Register not found")
            if (register.meterId != meterId) {
                throw NotFound("Register not found")
            }
            call.respond(HttpStatusCode.OK, register.toResponse())
        }

        put {
            val principal = getPrincipal(call)
            val meterId = call.parameters["meterId"]?.toLongOrNull() ?: throw BadRequest("Invalid meter id")
            val registerId = call.parameters["registerId"]?.toLongOrNull() ?: throw BadRequest("Invalid register id")
            val meter = meterRepo.findById(meterId) ?: throw NotFound("Meter not found")
            requireTransformerAccess(meter.transformerId, principal)
            val existing = meterRepo.findRegisterById(registerId) ?: throw NotFound("Register not found")
            if (existing.meterId != meterId) {
                throw NotFound("Register not found")
            }
            val req = call.receive<RegisterUpdateRequest>()
            val updated = existing.copy(
                name = req.name?.trim()?.takeIf { it.isNotBlank() } ?: existing.name,
                registerType = req.registerType ?: existing.registerType,
                address = req.address ?: existing.address,
                length = req.length ?: existing.length,
                dataType = req.dataType ?: existing.dataType,
                scale = req.scale ?: existing.scale,
                unit = req.unit ?: existing.unit,
                enabled = req.enabled ?: existing.enabled,
                orderIndex = req.orderIndex ?: existing.orderIndex,
            )
            meterRepo.updateRegister(registerId, updated)
            call.respond(HttpStatusCode.OK, updated.toResponse())
        }

        delete {
            val principal = getPrincipal(call)
            val meterId = call.parameters["meterId"]?.toLongOrNull() ?: throw BadRequest("Invalid meter id")
            val registerId = call.parameters["registerId"]?.toLongOrNull() ?: throw BadRequest("Invalid register id")
            val meter = meterRepo.findById(meterId) ?: throw NotFound("Meter not found")
            requireTransformerAccess(meter.transformerId, principal)
            val existing = meterRepo.findRegisterById(registerId) ?: throw NotFound("Register not found")
            if (existing.meterId != meterId) {
                throw NotFound("Register not found")
            }
            meterRepo.deleteRegister(registerId)
            call.respond(HttpStatusCode.NoContent)
        }
    }
}
