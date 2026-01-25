package com.example.core.util.passHash

interface Hasher {
    fun hash(password: String): String
    fun verify(password: String, hash: String): Boolean
}