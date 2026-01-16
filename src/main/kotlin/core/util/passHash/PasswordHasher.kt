package com.example.core.util.passHash

interface PasswordHasher {
    fun hashPassword(password: String): String
    fun verifyPassword(password: String, hash: String): Boolean
}