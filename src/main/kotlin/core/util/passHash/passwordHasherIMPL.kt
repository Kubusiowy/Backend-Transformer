package com.example.core.util.passHash

import org.mindrot.jbcrypt.BCrypt

object PasswordHasherIMPL:PasswordHasher {

    override fun hashPassword(password: String): String {
        return BCrypt.hashpw(password, BCrypt.gensalt(12))
    }

    override fun verifyPassword(hash: String, password: String): Boolean {
        return BCrypt.checkpw(password, hash)
    }

}