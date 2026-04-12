package com.demo.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.demo.app.data.local.entity.RollEntity
import com.demo.app.data.repository.BankrollRepository
import kotlinx.coroutines.launch

private val ICONS = listOf(
    "\uD83D\uDCB0", "\u2660\uFE0F", "\u2665\uFE0F", "\uD83C\uDFB2",
    "\uD83C\uDFB0", "\uD83D\uDCC8", "\uD83D\uDCB5", "\uD83D\uDCB3",
    "\uD83C\uDFC6", "\uD83C\uDFAF", "\uD83E\uDD11", "\u26BD",
    "\uD83C\uDFC8", "\uD83C\uDFC0", "\uD83D\uDCBC", "\uD83D\uDEE0\uFE0F"
)

private val COLORS = listOf(
    "#6C63FF", "#4CAF50", "#EF5350", "#FF9800",
    "#2196F3", "#9C27B0", "#00BCD4", "#FF5722",
    "#607D8B", "#E91E63", "#3F51B5", "#8BC34A"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditRollScreen(
    rollId: Long?,
    parentRollId: Long?,
    repository: BankrollRepository,
    onDone: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val isEdit = rollId != null

    var name by remember { mutableStateOf("") }
    var selectedIcon by remember { mutableStateOf(ICONS[0]) }
    var selectedColor by remember { mutableStateOf(COLORS[0]) }
    var description by remember { mutableStateOf("") }
    var loaded by remember { mutableStateOf(!isEdit) }

    // Load existing roll for editing
    LaunchedEffect(rollId) {
        if (rollId != null) {
            repository.getRollByIdOnce(rollId)?.let { roll ->
                name = roll.name
                selectedIcon = roll.icon
                selectedColor = roll.color
                description = roll.description
            }
            loaded = true
        }
    }

    if (!loaded) return

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEdit) "Edit Roll" else "New Roll") },
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
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Spacer(modifier = Modifier.height(4.dp))

            // Name field
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Roll Name") },
                placeholder = { Text("e.g. Poker, Stocks, Sports") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // Description field
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description (optional)") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3,
                shape = RoundedCornerShape(12.dp)
            )

            // Icon picker
            Text(
                text = "Icon",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            LazyVerticalGrid(
                columns = GridCells.Fixed(8),
                modifier = Modifier.height(96.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(ICONS) { icon ->
                    val isSelected = icon == selectedIcon
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(
                                if (isSelected)
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                                else
                                    Color.Transparent
                            )
                            .clickable { selectedIcon = icon },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = icon)
                    }
                }
            }

            // Color picker
            Text(
                text = "Color",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            LazyVerticalGrid(
                columns = GridCells.Fixed(6),
                modifier = Modifier.height(80.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(COLORS) { color ->
                    val parsedColor = Color(android.graphics.Color.parseColor(color))
                    val isSelected = color == selectedColor
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(parsedColor)
                            .clickable { selectedColor = color },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isSelected) {
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .clip(CircleShape)
                                    .background(Color.White)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Save button
            Button(
                onClick = {
                    if (name.isBlank()) return@Button
                    scope.launch {
                        if (isEdit && rollId != null) {
                            val existing = repository.getRollByIdOnce(rollId) ?: return@launch
                            repository.updateRoll(
                                existing.copy(
                                    name = name.trim(),
                                    icon = selectedIcon,
                                    color = selectedColor,
                                    description = description.trim()
                                )
                            )
                        } else {
                            repository.createRoll(
                                RollEntity(
                                    name = name.trim(),
                                    icon = selectedIcon,
                                    color = selectedColor,
                                    parentRollId = parentRollId,
                                    description = description.trim()
                                )
                            )
                        }
                        onDone()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                enabled = name.isNotBlank()
            ) {
                Text(if (isEdit) "Save Changes" else "Create Roll")
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
