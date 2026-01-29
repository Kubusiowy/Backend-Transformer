package com.example.features.IOT.meter.data

import com.example.core.db.dbQuery
import com.example.core.db.exposedTables.Meter
import com.example.core.db.exposedTables.MeterRegister
import com.example.core.db.exposedTables.Parity
import com.example.core.db.exposedTables.RegisterDataType
import com.example.core.db.exposedTables.RegisterType
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insertAndGetId
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update
import java.util.UUID

class MeterRepository {

    data class MeterRecord(
        val id: Long,
        val transformerId: UUID,
        val name: String,
        val deviceCode: String,
        val enabled: Boolean,
        val serialPort: String,
        val baudRate: Int,
        val parity: Parity,
        val stopBits: Int,
        val slaveId: Int,
        val pollIntervalMs: Int,
    )

    data class RegisterRecord(
        val id: Long,
        val meterId: Long,
        val name: String,
        val registerType: RegisterType,
        val address: Int,
        val length: Int,
        val dataType: RegisterDataType,
        val scale: Double,
        val unit: String?,
        val enabled: Boolean,
        val orderIndex: Int,
    )

    private fun rowToMeter(row: ResultRow): MeterRecord = MeterRecord(
        id = row[Meter.id],
        transformerId = UUID.fromString(row[Meter.transformerId]),
        name = row[Meter.name],
        deviceCode = row[Meter.deviceCode],
        enabled = row[Meter.enabled],
        serialPort = row[Meter.serialPort],
        baudRate = row[Meter.baudRate],
        parity = row[Meter.parity],
        stopBits = row[Meter.stopBits],
        slaveId = row[Meter.slaveId],
        pollIntervalMs = row[Meter.pollIntervalMs],
    )

    private fun rowToRegister(row: ResultRow): RegisterRecord = RegisterRecord(
        id = row[MeterRegister.id],
        meterId = row[MeterRegister.meterId],
        name = row[MeterRegister.name],
        registerType = row[MeterRegister.registerType],
        address = row[MeterRegister.address],
        length = row[MeterRegister.length],
        dataType = row[MeterRegister.dataType],
        scale = row[MeterRegister.scale],
        unit = row[MeterRegister.unit],
        enabled = row[MeterRegister.enabled],
        orderIndex = row[MeterRegister.orderIndex],
    )

    suspend fun listByTransformer(transformerId: UUID): List<MeterRecord> = dbQuery {
        Meter.selectAll().where { Meter.transformerId eq transformerId.toString() }.map(::rowToMeter)
    }

    suspend fun findById(id: Long): MeterRecord? = dbQuery {
        Meter.selectAll().where { Meter.id eq id }.firstOrNull()?.let(::rowToMeter)
    }

    suspend fun create(
        transformerId: UUID,
        name: String,
        deviceCode: String,
        enabled: Boolean,
        serialPort: String,
        baudRate: Int,
        parity: Parity,
        stopBits: Int,
        slaveId: Int,
        pollIntervalMs: Int,
    ): MeterRecord = dbQuery {
        val newId = Meter.insertAndGetId { row ->
            row[Meter.transformerId] = transformerId.toString()
            row[Meter.name] = name
            row[Meter.deviceCode] = deviceCode
            row[Meter.enabled] = enabled
            row[Meter.serialPort] = serialPort
            row[Meter.baudRate] = baudRate
            row[Meter.parity] = parity
            row[Meter.stopBits] = stopBits
            row[Meter.slaveId] = slaveId
            row[Meter.pollIntervalMs] = pollIntervalMs
        }.value
        rowToMeter(Meter.selectAll().where { Meter.id eq newId }.first())
    }

    suspend fun update(id: Long, updated: MeterRecord): Boolean = dbQuery {
        Meter.update({ Meter.id eq id }) { row ->
            row[name] = updated.name
            row[deviceCode] = updated.deviceCode
            row[enabled] = updated.enabled
            row[serialPort] = updated.serialPort
            row[baudRate] = updated.baudRate
            row[parity] = updated.parity
            row[stopBits] = updated.stopBits
            row[slaveId] = updated.slaveId
            row[pollIntervalMs] = updated.pollIntervalMs
        } > 0
    }

    suspend fun delete(id: Long): Boolean = dbQuery {
        Meter.deleteWhere { Meter.id eq id } > 0
    }

    suspend fun listRegisters(meterId: Long): List<RegisterRecord> = dbQuery {
        MeterRegister.selectAll().where { MeterRegister.meterId eq meterId }.map(::rowToRegister)
    }

    suspend fun findRegisterById(id: Long): RegisterRecord? = dbQuery {
        MeterRegister.selectAll().where { MeterRegister.id eq id }.firstOrNull()?.let(::rowToRegister)
    }

    suspend fun createRegister(
        meterId: Long,
        name: String,
        registerType: RegisterType,
        address: Int,
        length: Int,
        dataType: RegisterDataType,
        scale: Double,
        unit: String?,
        enabled: Boolean,
        orderIndex: Int,
    ): RegisterRecord = dbQuery {
        val newId = MeterRegister.insertAndGetId { row ->
            row[MeterRegister.meterId] = meterId
            row[MeterRegister.name] = name
            row[MeterRegister.registerType] = registerType
            row[MeterRegister.address] = address
            row[MeterRegister.length] = length
            row[MeterRegister.dataType] = dataType
            row[MeterRegister.scale] = scale
            row[MeterRegister.unit] = unit
            row[MeterRegister.enabled] = enabled
            row[MeterRegister.orderIndex] = orderIndex
        }.value
        rowToRegister(MeterRegister.selectAll().where { MeterRegister.id eq newId }.first())
    }

    suspend fun updateRegister(id: Long, updated: RegisterRecord): Boolean = dbQuery {
        MeterRegister.update({ MeterRegister.id eq id }) { row ->
            row[name] = updated.name
            row[registerType] = updated.registerType
            row[address] = updated.address
            row[length] = updated.length
            row[dataType] = updated.dataType
            row[scale] = updated.scale
            row[unit] = updated.unit
            row[enabled] = updated.enabled
            row[orderIndex] = updated.orderIndex
        } > 0
    }

    suspend fun deleteRegister(id: Long): Boolean = dbQuery {
        MeterRegister.deleteWhere { MeterRegister.id eq id } > 0
    }
}
