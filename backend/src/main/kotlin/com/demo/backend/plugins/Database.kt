package com.demo.backend.plugins

import io.ktor.server.application.*
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import com.demo.backend.models.Rolls
import com.demo.backend.models.Entries

fun Application.configureDatabase() {
    Database.connect("jdbc:sqlite:./data/bankroll.db", driver = "org.sqlite.JDBC")

    transaction {
        SchemaUtils.create(Rolls, Entries)
    }
}
