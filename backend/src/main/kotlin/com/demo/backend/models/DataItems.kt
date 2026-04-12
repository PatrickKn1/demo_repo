package com.demo.backend.models

import org.jetbrains.exposed.sql.Table

object DataItems : Table("data_items") {
    val id = long("id").autoIncrement()
    val label = varchar("label", 255)
    val value = double("value")
    val category = varchar("category", 255).default("")
    val createdAt = long("created_at").default(System.currentTimeMillis())

    override val primaryKey = PrimaryKey(id)
}

data class DataItem(
    val id: Long = 0,
    val label: String,
    val value: Double,
    val category: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
