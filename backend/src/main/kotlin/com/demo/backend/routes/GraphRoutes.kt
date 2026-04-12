package com.demo.backend.routes

import com.demo.backend.services.GraphService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

data class GraphEdge(
    val from: String,
    val to: String,
    val weight: Double = 1.0
)

data class GraphRequest(
    val nodes: List<String>,
    val edges: List<GraphEdge>,
    val source: String? = null,
    val target: String? = null
)

fun Route.graphRoutes() {
    route("api/graph") {
        post("shortest-path") {
            val request = call.receive<GraphRequest>()
            val result = GraphService.shortestPath(
                nodes = request.nodes,
                edges = request.edges.map { Triple(it.from, it.to, it.weight) },
                source = request.source ?: request.nodes.first(),
                target = request.target ?: request.nodes.last()
            )
            call.respond(HttpStatusCode.OK, mapOf("path" to result.first, "distance" to result.second))
        }

        post("neighbors") {
            val request = call.receive<GraphRequest>()
            val source = request.source ?: request.nodes.first()
            val result = GraphService.neighbors(
                edges = request.edges.map { Triple(it.from, it.to, it.weight) },
                node = source
            )
            call.respond(HttpStatusCode.OK, mapOf("node" to source, "neighbors" to result))
        }
    }
}
