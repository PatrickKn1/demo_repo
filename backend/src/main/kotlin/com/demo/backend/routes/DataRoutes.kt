package com.demo.backend.routes

import com.demo.backend.models.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

fun Route.rollRoutes() {
    route("api/rolls") {
        get {
            val userId = call.request.queryParameters["userId"] ?: "local"
            val parentId = call.request.queryParameters["parentId"]?.toLongOrNull()

            val rolls = transaction {
                val query = if (parentId != null) {
                    Rolls.selectAll().where { (Rolls.userId eq userId) and (Rolls.parentRollId eq parentId) }
                } else {
                    Rolls.selectAll().where { (Rolls.userId eq userId) and Rolls.parentRollId.isNull() }
                }
                query.orderBy(Rolls.createdAt, SortOrder.DESC).map { it.toRoll() }
            }
            call.respond(HttpStatusCode.OK, rolls)
        }

        get("{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
            val roll = transaction {
                Rolls.selectAll().where { Rolls.id eq id }.map { it.toRoll() }.firstOrNull()
            }
            if (roll != null) call.respond(HttpStatusCode.OK, roll)
            else call.respond(HttpStatusCode.NotFound, mapOf("error" to "Roll not found"))
        }

        post {
            val roll = call.receive<Roll>()
            val id = transaction {
                Rolls.insert {
                    it[name] = roll.name
                    it[icon] = roll.icon
                    it[color] = roll.color
                    it[parentRollId] = roll.parentRollId
                    it[description] = roll.description
                    it[userId] = roll.userId
                    it[createdAt] = roll.createdAt
                } get Rolls.id
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to id))
        }

        put("{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
            val roll = call.receive<Roll>()
            transaction {
                Rolls.update({ Rolls.id eq id }) {
                    it[name] = roll.name
                    it[icon] = roll.icon
                    it[color] = roll.color
                    it[description] = roll.description
                }
            }
            call.respond(HttpStatusCode.OK, mapOf("updated" to id))
        }

        delete("{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
            transaction {
                Entries.deleteWhere { rollId eq id }
                // Delete sub-rolls and their entries
                val subRollIds = Rolls.selectAll().where { Rolls.parentRollId eq id }.map { it[Rolls.id] }
                subRollIds.forEach { subId ->
                    Entries.deleteWhere { rollId eq subId }
                }
                Rolls.deleteWhere { parentRollId eq id }
                Rolls.deleteWhere { Rolls.id eq id }
            }
            call.respond(HttpStatusCode.OK, mapOf("deleted" to id))
        }

        // Stats for a roll
        get("{id}/stats") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))

            val stats = transaction {
                val allRollIds = mutableListOf(id)
                val subIds = Rolls.selectAll().where { Rolls.parentRollId eq id }.map { it[Rolls.id] }
                allRollIds.addAll(subIds)

                val entries = Entries.selectAll().where { Entries.rollId inList allRollIds }
                    .map { it.toEntry() }

                if (entries.isEmpty()) {
                    mapOf("totalProfit" to 0.0, "entryCount" to 0, "winRate" to 0.0, "avgProfit" to 0.0)
                } else {
                    val totalProfit = entries.sumOf { it.profit }
                    val winCount = entries.count { it.profit > 0 }
                    mapOf(
                        "totalProfit" to totalProfit,
                        "entryCount" to entries.size,
                        "winRate" to (winCount.toDouble() / entries.size),
                        "avgProfit" to (totalProfit / entries.size),
                        "biggestWin" to (entries.maxOfOrNull { it.profit } ?: 0.0),
                        "biggestLoss" to (entries.minOfOrNull { it.profit } ?: 0.0)
                    )
                }
            }
            call.respond(HttpStatusCode.OK, stats)
        }
    }
}

fun Route.entryRoutes() {
    route("api/entries") {
        get {
            val rollId = call.request.queryParameters["rollId"]?.toLongOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "rollId required"))

            val entries = transaction {
                Entries.selectAll().where { Entries.rollId eq rollId }
                    .orderBy(Entries.date, SortOrder.DESC)
                    .map { it.toEntry() }
            }
            call.respond(HttpStatusCode.OK, entries)
        }

        post {
            val entry = call.receive<Entry>()
            val id = transaction {
                Entries.insert {
                    it[rollId] = entry.rollId
                    it[buyIn] = entry.buyIn
                    it[cashOut] = entry.cashOut
                    it[date] = entry.date
                    it[notes] = entry.notes
                    it[createdAt] = entry.createdAt
                } get Entries.id
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to id))
        }

        put("{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
            val entry = call.receive<Entry>()
            transaction {
                Entries.update({ Entries.id eq id }) {
                    it[buyIn] = entry.buyIn
                    it[cashOut] = entry.cashOut
                    it[date] = entry.date
                    it[notes] = entry.notes
                }
            }
            call.respond(HttpStatusCode.OK, mapOf("updated" to id))
        }

        delete("{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid ID"))
            transaction { Entries.deleteWhere { Entries.id eq id } }
            call.respond(HttpStatusCode.OK, mapOf("deleted" to id))
        }
    }
}

private fun ResultRow.toRoll() = Roll(
    id = this[Rolls.id],
    name = this[Rolls.name],
    icon = this[Rolls.icon],
    color = this[Rolls.color],
    parentRollId = this[Rolls.parentRollId],
    description = this[Rolls.description],
    userId = this[Rolls.userId],
    createdAt = this[Rolls.createdAt]
)

private fun ResultRow.toEntry() = Entry(
    id = this[Entries.id],
    rollId = this[Entries.rollId],
    buyIn = this[Entries.buyIn],
    cashOut = this[Entries.cashOut],
    date = this[Entries.date],
    notes = this[Entries.notes],
    createdAt = this[Entries.createdAt]
)
