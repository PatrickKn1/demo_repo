package com.demo.backend.plugins

import io.ktor.server.application.*
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import com.demo.backend.models.DataItems

fun Application.configureDatabase() {
    Database.connect("jdbc:sqlite:./data/demo.db", driver = "org.sqlite.JDBC")

    transaction {
        SchemaUtils.create(DataItems)
    }
}
