package com.demo.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.CreateNewFolder
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.demo.app.data.repository.BankrollRepository
import com.demo.app.ui.components.*
import com.demo.app.ui.viewmodel.RollDetailViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RollDetailScreen(
    rollId: Long,
    repository: BankrollRepository,
    onBack: () -> Unit,
    onAddEntry: () -> Unit,
    onEditEntry: (Long) -> Unit,
    onSubRollClick: (Long) -> Unit,
    onAddSubRoll: () -> Unit,
    onEditRoll: () -> Unit,
    viewModel: RollDetailViewModel = viewModel(
        factory = RollDetailViewModel.Factory(rollId, repository)
    )
) {
    val roll by viewModel.roll.collectAsState()
    val entries by viewModel.filteredEntries.collectAsState()
    val allEntries by viewModel.allEntriesIncludingSubRolls.collectAsState()
    val subRollSummaries by viewModel.subRollSummaries.collectAsState()
    val profitFilter by viewModel.profitFilter.collectAsState()
    val sortOrder by viewModel.sortOrder.collectAsState()

    var showDeleteDialog by remember { mutableStateOf(false) }
    var entryToDelete by remember { mutableStateOf<Long?>(null) }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Roll") },
            text = { Text("This will permanently delete this roll and all its entries and sub-rolls.") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteRoll()
                    showDeleteDialog = false
                    onBack()
                }) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel") }
            }
        )
    }

    entryToDelete?.let { id ->
        AlertDialog(
            onDismissRequest = { entryToDelete = null },
            title = { Text("Delete Entry") },
            text = { Text("Are you sure you want to delete this entry?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteEntry(id)
                    entryToDelete = null
                }) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { entryToDelete = null }) { Text("Cancel") }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        roll?.let {
                            Text(
                                text = "${it.icon} ${it.name}",
                                style = MaterialTheme.typography.headlineSmall
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onAddSubRoll) {
                        Icon(Icons.Outlined.CreateNewFolder, contentDescription = "Add Sub-Roll")
                    }
                    IconButton(onClick = onEditRoll) {
                        Icon(Icons.Outlined.Edit, contentDescription = "Edit Roll")
                    }
                    IconButton(onClick = { showDeleteDialog = true }) {
                        Icon(
                            Icons.Outlined.Delete,
                            contentDescription = "Delete Roll",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddEntry,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Add Entry")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(bottom = 88.dp)
        ) {
            // Stats card (uses all entries including sub-rolls)
            if (allEntries.isNotEmpty()) {
                item { StatsCard(entries = allEntries) }
                item { ProfitChart(entries = allEntries) }
            }

            // Sub-rolls
            if (subRollSummaries.isNotEmpty()) {
                item {
                    Text(
                        text = "Sub-Rolls",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
                items(subRollSummaries, key = { it.roll.id }) { summary ->
                    RollCard(
                        roll = summary.roll,
                        totalProfit = summary.totalProfit,
                        entryCount = summary.entryCount,
                        onClick = { onSubRollClick(summary.roll.id) }
                    )
                }
            }

            // Filter bar + entries header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Entries",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                FilterBar(
                    profitFilter = profitFilter,
                    onProfitFilterChange = { viewModel.profitFilter.value = it },
                    sortOrder = sortOrder,
                    onSortOrderChange = { viewModel.sortOrder.value = it }
                )
            }

            if (entries.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No entries yet. Tap + to add one.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                items(entries, key = { it.id }) { entry ->
                    EntryCard(
                        entry = entry,
                        onEdit = { onEditEntry(entry.id) },
                        onDelete = { entryToDelete = entry.id }
                    )
                }
            }
        }
    }
}
