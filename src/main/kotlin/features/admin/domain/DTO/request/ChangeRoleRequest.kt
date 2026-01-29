package com.example.features.admin.domain.DTO.request

import com.example.core.model.user.Role.UserRole
import kotlinx.serialization.Serializable

@Serializable
data class ChangeRoleRequest(
    val role: UserRole,
)
