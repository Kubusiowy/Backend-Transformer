package com.example.features.auth.common

import java.security.MessageDigest

// Hash the entire JWT: bcrypt only uses the first 72 bytes of its input.
fun tokenDigest(token: String): String = MessageDigest.getInstance("SHA-256")
    .digest(token.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }
