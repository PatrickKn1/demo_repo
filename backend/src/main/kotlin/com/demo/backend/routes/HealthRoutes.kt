package com.demo.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.healthRoutes() {
    get("api/health") {
        call.respond(HttpStatusCode.OK, mapOf("status" to "ok"))
    }
}
