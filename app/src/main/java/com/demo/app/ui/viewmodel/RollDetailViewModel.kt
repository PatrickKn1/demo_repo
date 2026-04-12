package com.demo.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.demo.app.data.local.entity.EntryEntity
import com.demo.app.data.local.entity.RollEntity
import com.demo.app.data.repository.BankrollRepository
import com.demo.app.ui.components.ProfitFilter
import com.demo.app.ui.components.SortOrder
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class RollDetailViewModel(
    private val rollId: Long,
    private val repository: BankrollRepository
) : ViewModel() {

    val roll: StateFlow<RollEntity?> = repository.getRollById(rollId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    private val rawEntries: StateFlow<List<EntryEntity>> =
        repository.getEntriesForRoll(rollId)
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allEntriesIncludingSubRolls: StateFlow<List<EntryEntity>> =
        repository.getEntriesForRollAndSubRolls(rollId)
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _subRollSummaries = MutableStateFlow<List<RollSummary>>(emptyList())
    val subRollSummaries: StateFlow<List<RollSummary>> = _subRollSummaries.asStateFlow()

    val profitFilter = MutableStateFlow(ProfitFilter.ALL)
    val sortOrder = MutableStateFlow(SortOrder.DATE_DESC)

    val filteredEntries: StateFlow<List<EntryEntity>> = combine(
        rawEntries, profitFilter, sortOrder
    ) { entries, pFilter, sort ->
        var result = when (pFilter) {
            ProfitFilter.ALL -> entries
            ProfitFilter.WINS -> entries.filter { it.cashOut - it.buyIn > 0 }
            ProfitFilter.LOSSES -> entries.filter { it.cashOut - it.buyIn <= 0 }
        }
        result = when (sort) {
            SortOrder.DATE_DESC -> result.sortedByDescending { it.date }
            SortOrder.DATE_ASC -> result.sortedBy { it.date }
            SortOrder.PROFIT_DESC -> result.sortedByDescending { it.cashOut - it.buyIn }
            SortOrder.PROFIT_ASC -> result.sortedBy { it.cashOut - it.buyIn }
        }
        result
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        viewModelScope.launch {
            repository.getSubRolls(rollId).collect { subRolls ->
                val summaries = subRolls.map { roll ->
                    val profit = repository.getTotalProfit(roll.id).firstOrNull() ?: 0.0
                    val count = repository.getEntryCount(roll.id).firstOrNull() ?: 0
                    RollSummary(roll, profit, count)
                }
                _subRollSummaries.value = summaries
            }
        }
    }

    fun deleteEntry(id: Long) {
        viewModelScope.launch { repository.deleteEntry(id) }
    }

    fun deleteRoll() {
        viewModelScope.launch { repository.deleteRoll(rollId) }
    }

    class Factory(
        private val rollId: Long,
        private val repository: BankrollRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            RollDetailViewModel(rollId, repository) as T
    }
}
