package com.demo.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

enum class ProfitFilter(val label: String) {
    ALL("All"),
    WINS("Wins"),
    LOSSES("Losses")
}

enum class SortOrder(val label: String) {
    DATE_DESC("Newest"),
    DATE_ASC("Oldest"),
    PROFIT_DESC("Best first"),
    PROFIT_ASC("Worst first")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterBar(
    profitFilter: ProfitFilter,
    onProfitFilterChange: (ProfitFilter) -> Unit,
    sortOrder: SortOrder,
    onSortOrderChange: (SortOrder) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = modifier.fillMaxWidth()) {
        // Toggle button — minimal when collapsed
        TextButton(
            onClick = { expanded = !expanded },
            modifier = Modifier.align(Alignment.End)
        ) {
            Icon(
                imageVector = Icons.Filled.List,
                contentDescription = "Filters",
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = if (expanded) "Hide filters" else "Filters",
                style = MaterialTheme.typography.labelMedium
            )
        }

        AnimatedVisibility(
            visible = expanded,
            enter = expandVertically(),
            exit = shrinkVertically()
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    // Profit filter chips
                    Text(
                        text = "Show",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ProfitFilter.entries.forEach { filter ->
                            FilterChip(
                                selected = profitFilter == filter,
                                onClick = { onProfitFilterChange(filter) },
                                label = { Text(filter.label, style = MaterialTheme.typography.labelMedium) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Sort order chips
                    Text(
                        text = "Sort by",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        SortOrder.entries.forEach { order ->
                            FilterChip(
                                selected = sortOrder == order,
                                onClick = { onSortOrderChange(order) },
                                label = { Text(order.label, style = MaterialTheme.typography.labelMedium) }
                            )
                        }
                    }
                }
            }
        }
    }
}
