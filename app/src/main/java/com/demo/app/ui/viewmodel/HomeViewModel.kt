package com.demo.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.demo.app.data.local.entity.RollEntity
import com.demo.app.data.repository.BankrollRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class RollSummary(
    val roll: RollEntity,
    val totalProfit: Double,
    val entryCount: Int
)

class HomeViewModel(private val repository: BankrollRepository) : ViewModel() {

    private val _rollSummaries = MutableStateFlow<List<RollSummary>>(emptyList())
    val rollSummaries: StateFlow<List<RollSummary>> = _rollSummaries.asStateFlow()

    init {
        viewModelScope.launch {
            repository.getTopLevelRolls().collect { rolls ->
                val summaries = rolls.map { roll ->
                    val profit = repository.getTotalProfit(roll.id).firstOrNull() ?: 0.0
                    val count = repository.getEntryCount(roll.id).firstOrNull() ?: 0
                    RollSummary(roll, profit, count)
                }
                _rollSummaries.value = summaries
            }
        }
    }

    fun deleteRoll(id: Long) {
        viewModelScope.launch { repository.deleteRoll(id) }
    }

    class Factory(private val repository: BankrollRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            HomeViewModel(repository) as T
    }
}
