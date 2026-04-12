package com.demo.backend.models

import org.jetbrains.exposed.sql.Table

object Rolls : Table("rolls") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 255)
    val icon = varchar("icon", 32).default("\uD83D\uDCB0")
    val color = varchar("color", 16).default("#6C63FF")
    val parentRollId = long("parent_roll_id").nullable().references(id)
    val description = varchar("description", 1024).default("")
    val userId = varchar("user_id", 255).default("local")
    val createdAt = long("created_at").default(System.currentTimeMillis())

    override val primaryKey = PrimaryKey(id)
}

object Entries : Table("entries") {
    val id = long("id").autoIncrement()
    val rollId = long("roll_id").references(Rolls.id)
    val buyIn = double("buy_in")
    val cashOut = double("cash_out")
    val date = long("date").default(System.currentTimeMillis())
    val notes = varchar("notes", 4096).default("")
    val createdAt = long("created_at").default(System.currentTimeMillis())

    override val primaryKey = PrimaryKey(id)
}

data class Roll(
    val id: Long = 0,
    val name: String,
    val icon: String = "\uD83D\uDCB0",
    val color: String = "#6C63FF",
    val parentRollId: Long? = null,
    val description: String = "",
    val userId: String = "local",
    val createdAt: Long = System.currentTimeMillis()
)

data class Entry(
    val id: Long = 0,
    val rollId: Long,
    val buyIn: Double,
    val cashOut: Double,
    val date: Long = System.currentTimeMillis(),
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
) {
    val profit: Double get() = cashOut - buyIn
}
