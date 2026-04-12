package com.demo.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.demo.app.data.local.entity.RollEntity
import com.demo.app.util.FormatUtils

@Composable
fun RollCard(
    roll: RollEntity,
    totalProfit: Double,
    entryCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val rollColor = try {
        Color(android.graphics.Color.parseColor(roll.color))
    } catch (_: Exception) {
        MaterialTheme.colorScheme.primary
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon circle
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(rollColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(text = roll.icon, style = MaterialTheme.typography.titleLarge)
            }

            Spacer(modifier = Modifier.width(14.dp))

            // Name + entry count
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = roll.name,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "$entryCount ${if (entryCount == 1) "entry" else "entries"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Profit / loss
            val profitColor = when {
                totalProfit > 0 -> Color(0xFF4CAF50)
                totalProfit < 0 -> Color(0xFFEF5350)
                else -> MaterialTheme.colorScheme.onSurfaceVariant
            }
            Text(
                text = FormatUtils.formatProfit(totalProfit),
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = profitColor
            )
        }
    }
}
