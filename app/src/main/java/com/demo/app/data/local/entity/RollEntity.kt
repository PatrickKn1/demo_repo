package com.demo.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "rolls",
    foreignKeys = [
        ForeignKey(
            entity = RollEntity::class,
            parentColumns = ["id"],
            childColumns = ["parentRollId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("parentRollId")]
)
data class RollEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val icon: String = "💰",
    val color: String = "#6C63FF",
    val parentRollId: Long? = null,
    val description: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
