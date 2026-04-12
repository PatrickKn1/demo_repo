package com.demo.app.data.repository

import com.demo.app.data.local.dao.EntryDao
import com.demo.app.data.local.dao.RollDao
import com.demo.app.data.local.entity.EntryEntity
import com.demo.app.data.local.entity.RollEntity
import kotlinx.coroutines.flow.Flow

class BankrollRepository(
    private val rollDao: RollDao,
    private val entryDao: EntryDao
) {
    // ── Rolls ──────────────────────────────────────────────

    fun getTopLevelRolls(): Flow<List<RollEntity>> = rollDao.getTopLevelRolls()

    fun getSubRolls(parentId: Long): Flow<List<RollEntity>> = rollDao.getSubRolls(parentId)

    fun getRollById(id: Long): Flow<RollEntity?> = rollDao.getByIdFlow(id)

    suspend fun getRollByIdOnce(id: Long): RollEntity? = rollDao.getById(id)

    suspend fun createRoll(roll: RollEntity): Long = rollDao.insert(roll)

    suspend fun updateRoll(roll: RollEntity) = rollDao.update(roll)

    suspend fun deleteRoll(id: Long) = rollDao.deleteById(id)

    // ── Entries ────────────────────────────────────────────

    fun getEntriesForRoll(rollId: Long): Flow<List<EntryEntity>> =
        entryDao.getEntriesForRoll(rollId)

    fun getEntriesForRollAndSubRolls(rollId: Long): Flow<List<EntryEntity>> =
        entryDao.getEntriesForRollAndSubRolls(rollId)

    fun getEntriesInDateRange(rollId: Long, start: Long, end: Long): Flow<List<EntryEntity>> =
        entryDao.getEntriesForRollInDateRange(rollId, start, end)

    fun getTotalProfit(rollId: Long): Flow<Double?> =
        entryDao.getTotalProfitForRoll(rollId)

    fun getEntryCount(rollId: Long): Flow<Int> =
        entryDao.getEntryCountForRoll(rollId)

    suspend fun getEntryById(id: Long): EntryEntity? = entryDao.getById(id)

    suspend fun createEntry(entry: EntryEntity): Long = entryDao.insert(entry)

    suspend fun updateEntry(entry: EntryEntity) = entryDao.update(entry)

    suspend fun deleteEntry(id: Long) = entryDao.deleteById(id)
}
