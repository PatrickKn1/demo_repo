package com.demo.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.demo.app.data.local.entity.EntryEntity
import com.demo.app.data.repository.BankrollRepository
import com.demo.app.util.FormatUtils
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditEntryScreen(
    entryId: Long?,
    rollId: Long,
    repository: BankrollRepository,
    onDone: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val isEdit = entryId != null

    var buyInText by remember { mutableStateOf("") }
    var cashOutText by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var dateMillis by remember { mutableStateOf(System.currentTimeMillis()) }
    var actualRollId by remember { mutableStateOf(rollId) }
    var loaded by remember { mutableStateOf(!isEdit) }

    var showDatePicker by remember { mutableStateOf(false) }

    // Load existing entry for editing
    LaunchedEffect(entryId) {
        if (entryId != null) {
            repository.getEntryById(entryId)?.let { entry ->
                buyInText = if (entry.buyIn == 0.0) "" else entry.buyIn.toBigDecimal().stripTrailingZeros().toPlainString()
                cashOutText = if (entry.cashOut == 0.0) "" else entry.cashOut.toBigDecimal().stripTrailingZeros().toPlainString()
                notes = entry.notes
                dateMillis = entry.date
                actualRollId = entry.rollId
            }
            loaded = true
        }
    }

    if (!loaded) return

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = dateMillis
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { dateMillis = it }
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEdit) "Edit Entry" else "New Entry") },
                navigationIcon = {
                    IconButton(onClick = onDone) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Spacer(modifier = Modifier.height(4.dp))

            // Date selector
            OutlinedButton(
                onClick = { showDatePicker = true },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = FormatUtils.formatDate(dateMillis),
                    style = MaterialTheme.typography.bodyLarge
                )
            }

            // Buy-in field
            OutlinedTextField(
                value = buyInText,
                onValueChange = { buyInText = it.filter { c -> c.isDigit() || c == '.' } },
                label = { Text("Buy-in Amount") },
                placeholder = { Text("0.00") },
                prefix = { Text("$") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // Cash-out field
            OutlinedTextField(
                value = cashOutText,
                onValueChange = { cashOutText = it.filter { c -> c.isDigit() || c == '.' } },
                label = { Text("Cash-out Amount") },
                placeholder = { Text("0.00") },
                prefix = { Text("$") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // Live P/L preview
            val buyIn = buyInText.toDoubleOrNull() ?: 0.0
            val cashOut = cashOutText.toDoubleOrNull() ?: 0.0
            val profit = cashOut - buyIn
            if (buyInText.isNotBlank() || cashOutText.isNotBlank()) {
                val profitColor = when {
                    profit > 0 -> androidx.compose.ui.graphics.Color(0xFF4CAF50)
                    profit < 0 -> androidx.compose.ui.graphics.Color(0xFFEF5350)
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Profit/Loss",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = FormatUtils.formatProfit(profit),
                            style = MaterialTheme.typography.titleMedium,
                            color = profitColor
                        )
                    }
                }
            }

            // Notes field
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes (optional)") },
                placeholder = { Text("Table info, opponents, stakes, etc.") },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 100.dp),
                maxLines = 6,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.weight(1f))

            // Save button
            Button(
                onClick = {
                    scope.launch {
                        val buyInVal = buyInText.toDoubleOrNull() ?: 0.0
                        val cashOutVal = cashOutText.toDoubleOrNull() ?: 0.0
                        if (isEdit && entryId != null) {
                            val existing = repository.getEntryById(entryId) ?: return@launch
                            repository.updateEntry(
                                existing.copy(
                                    buyIn = buyInVal,
                                    cashOut = cashOutVal,
                                    date = dateMillis,
                                    notes = notes.trim()
                                )
                            )
                        } else {
                            repository.createEntry(
                                EntryEntity(
                                    rollId = actualRollId,
                                    buyIn = buyInVal,
                                    cashOut = cashOutVal,
                                    date = dateMillis,
                                    notes = notes.trim()
                                )
                            )
                        }
                        onDone()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(if (isEdit) "Save Changes" else "Add Entry")
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
