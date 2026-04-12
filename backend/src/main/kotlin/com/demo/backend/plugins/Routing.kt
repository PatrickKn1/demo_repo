package com.demo.backend.plugins

import com.demo.backend.routes.healthRoutes
import com.demo.backend.routes.mathRoutes
import com.demo.backend.routes.graphRoutes
import com.demo.backend.routes.dataRoutes
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
        healthRoutes()
        mathRoutes()
        graphRoutes()
        dataRoutes()
    }
}
