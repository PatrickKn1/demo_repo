package com.demo.app.data.remote.model

data class RollDto(
    val id: Long = 0,
    val name: String,
    val icon: String = "\uD83D\uDCB0",
    val color: String = "#6C63FF",
    val parentRollId: Long? = null,
    val description: String = "",
    val userId: String = "local",
    val createdAt: Long = System.currentTimeMillis()
)

data class EntryDto(
    val id: Long = 0,
    val rollId: Long,
    val buyIn: Double,
    val cashOut: Double,
    val date: Long = System.currentTimeMillis(),
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

data class RollStatsDto(
    val totalProfit: Double = 0.0,
    val entryCount: Int = 0,
    val winRate: Double = 0.0,
    val avgProfit: Double = 0.0,
    val biggestWin: Double = 0.0,
    val biggestLoss: Double = 0.0
)

data class MathRequest(
    val operation: String,
    val values: List<Double>
)

data class MathResponse(
    val operation: String,
    val result: Double
)
