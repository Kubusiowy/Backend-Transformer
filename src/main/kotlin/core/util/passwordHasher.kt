package com.example.core.util

import org.mindrot.jbcrypt.BCrypt

object PasswordHasher {

    fun hash(password: String): String {
        return BCrypt.hashpw(password, BCrypt.gensalt(12))
    }

    fun verify(hash: String, password: String): Boolean {
        return BCrypt.checkpw(password, hash)
    }

}