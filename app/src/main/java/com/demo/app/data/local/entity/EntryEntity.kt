package com.demo.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "entries",
    foreignKeys = [
        ForeignKey(
            entity = RollEntity::class,
            parentColumns = ["id"],
            childColumns = ["rollId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("rollId")]
)
data class EntryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val rollId: Long,
    val buyIn: Double,
    val cashOut: Double,
    val date: Long = System.currentTimeMillis(),
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
) {
    val profit: Double get() = cashOut - buyIn
}
