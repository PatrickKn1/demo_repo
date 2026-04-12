package com.demo.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.demo.app.data.local.entity.EntryEntity

@Composable
fun ProfitChart(
    entries: List<EntryEntity>,
    modifier: Modifier = Modifier
) {
    if (entries.size < 2) return

    // Compute running P/L, sorted by date ascending
    val sorted = entries.sortedBy { it.date }
    val runningPL = mutableListOf(0.0)
    sorted.forEach { runningPL.add(runningPL.last() + it.cashOut - it.buyIn) }

    val minVal = runningPL.min()
    val maxVal = runningPL.max()
    val range = (maxVal - minVal).coerceAtLeast(1.0)

    val greenColor = Color(0xFF4CAF50)
    val redColor = Color(0xFFEF5350)
    val lineColor = if (runningPL.last() >= 0) greenColor else redColor
    val zeroLineColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.2f)
    val fillColor = lineColor.copy(alpha = 0.08f)

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
                text = "Running P/L",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))

            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
            ) {
                val w = size.width
                val h = size.height
                val stepX = w / (runningPL.size - 1).coerceAtLeast(1)

                fun yFor(value: Double): Float =
                    (h - ((value - minVal) / range * h)).toFloat()

                // Zero line
                val zeroY = yFor(0.0)
                drawLine(
                    color = zeroLineColor,
                    start = Offset(0f, zeroY),
                    end = Offset(w, zeroY),
                    strokeWidth = 1.dp.toPx()
                )

                // Fill area under the line
                val fillPath = Path().apply {
                    moveTo(0f, zeroY)
                    runningPL.forEachIndexed { i, v ->
                        lineTo(i * stepX, yFor(v))
                    }
                    lineTo((runningPL.size - 1) * stepX, zeroY)
                    close()
                }
                drawPath(fillPath, fillColor)

                // Line
                val linePath = Path().apply {
                    runningPL.forEachIndexed { i, v ->
                        val x = i * stepX
                        val y = yFor(v)
                        if (i == 0) moveTo(x, y) else lineTo(x, y)
                    }
                }
                drawPath(
                    linePath,
                    lineColor,
                    style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                )

                // End dot
                val lastX = (runningPL.size - 1) * stepX
                val lastY = yFor(runningPL.last())
                drawCircle(lineColor, radius = 4.dp.toPx(), center = Offset(lastX, lastY))
            }
        }
    }
}
