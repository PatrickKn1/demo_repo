package com.demo.backend.routes

import com.demo.backend.models.DataItem
import com.demo.backend.models.DataItems
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

fun Route.dataRoutes() {
    route("api/data") {
        get {
            val items = transaction {
                DataItems.selectAll().map {
                    DataItem(
                        id = it[DataItems.id],
                        label = it[DataItems.label],
                        value = it[DataItems.value],
                        category = it[DataItems.category],
                        createdAt = it[DataItems.createdAt]
                    )
                }
            }
            call.respond(HttpStatusCode.OK, items)
        }

        get("{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))

            val item = transaction {
                DataItems.selectAll().where { DataItems.id eq id }.map {
                    DataItem(
                        id = it[DataItems.id],
                        label = it[DataItems.label],
                        value = it[DataItems.value],
                        category = it[DataItems.category],
                        createdAt = it[DataItems.createdAt]
                    )
                }.firstOrNull()
            }

            if (item != null) {
                call.respond(HttpStatusCode.OK, item)
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Item not found"))
            }
        }

        post {
            val item = call.receive<DataItem>()
            val id = transaction {
                DataItems.insert {
                    it[label] = item.label
                    it[value] = item.value
                    it[category] = item.category
                    it[createdAt] = item.createdAt
                } get DataItems.id
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to id))
        }

        delete("{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))

            transaction {
                DataItems.deleteWhere { DataItems.id eq id }
            }
            call.respond(HttpStatusCode.OK, mapOf("deleted" to id))
        }
    }
}
