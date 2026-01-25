package com.example.core.util.passHash

import org.mindrot.jbcrypt.BCrypt

object HasherIMPL:Hasher {

    override fun hash(password: String): String {
        return BCrypt.hashpw(password, BCrypt.gensalt(12))
    }

    override fun verify(password: String,hash: String): Boolean {
        return BCrypt.checkpw(password, hash)
    }

}