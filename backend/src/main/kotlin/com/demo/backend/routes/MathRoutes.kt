package com.demo.backend.routes

import com.demo.backend.services.MathService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

data class MathRequest(
    val operation: String,
    val values: List<Double>
)

data class MathResponse(
    val operation: String,
    val result: Double
)

fun Route.mathRoutes() {
    route("api/math") {
        post("calculate") {
            val request = call.receive<MathRequest>()
            val result = MathService.calculate(request.operation, request.values)
            call.respond(HttpStatusCode.OK, MathResponse(request.operation, result))
        }
    }
}
