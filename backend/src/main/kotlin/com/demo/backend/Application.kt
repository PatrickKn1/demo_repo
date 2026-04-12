package com.demo.backend

import com.demo.backend.plugins.configureRouting
import com.demo.backend.plugins.configureSerialization
import com.demo.backend.plugins.configureDatabase
import com.demo.backend.plugins.configureCors
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    configureDatabase()
    configureSerialization()
    configureCors()
    configureRouting()
}
