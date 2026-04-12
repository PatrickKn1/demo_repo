package com.demo.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.demo.app.data.local.entity.EntryEntity
import com.demo.app.util.FormatUtils

@Composable
fun StatsCard(
    entries: List<EntryEntity>,
    modifier: Modifier = Modifier
) {
    if (entries.isEmpty()) return

    val totalProfit = entries.sumOf { it.cashOut - it.buyIn }
    val totalBuyIn = entries.sumOf { it.buyIn }
    val winCount = entries.count { it.cashOut - it.buyIn > 0 }
    val winRate = winCount.toDouble() / entries.size
    val avgProfit = totalProfit / entries.size
    val biggestWin = entries.maxOfOrNull { it.cashOut - it.buyIn } ?: 0.0
    val biggestLoss = entries.minOfOrNull { it.cashOut - it.buyIn } ?: 0.0

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Stats",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StatItem("Total P/L", FormatUtils.formatProfit(totalProfit), profitColor(totalProfit))
                StatItem("Win Rate", FormatUtils.formatPercent(winRate), profitColor(winRate - 0.5))
                StatItem("Sessions", entries.size.toString(), MaterialTheme.colorScheme.onSurface)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StatItem("Avg P/L", FormatUtils.formatProfit(avgProfit), profitColor(avgProfit))
                StatItem("Best", FormatUtils.formatProfit(biggestWin), Color(0xFF4CAF50))
                StatItem("Worst", FormatUtils.formatProfit(biggestLoss), Color(0xFFEF5350))
            }

            if (totalBuyIn > 0) {
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    StatItem("ROI", FormatUtils.formatPercent(totalProfit / totalBuyIn), profitColor(totalProfit))
                    StatItem("Total In", FormatUtils.formatCurrency(totalBuyIn), MaterialTheme.colorScheme.onSurface)
                    StatItem("Total Out", FormatUtils.formatCurrency(entries.sumOf { it.cashOut }), MaterialTheme.colorScheme.onSurface)
                }
            }
        }
    }
}

@Composable
private fun StatItem(label: String, value: String, valueColor: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = valueColor
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun profitColor(value: Double): Color = when {
    value > 0 -> Color(0xFF4CAF50)
    value < 0 -> Color(0xFFEF5350)
    else -> MaterialTheme.colorScheme.onSurfaceVariant
}
