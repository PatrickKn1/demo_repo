package com.demo.app.data.local.dao

import androidx.room.*
import com.demo.app.data.local.entity.EntryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EntryDao {

    @Query("SELECT * FROM entries WHERE rollId = :rollId ORDER BY date DESC")
    fun getEntriesForRoll(rollId: Long): Flow<List<EntryEntity>>

    @Query("""
        SELECT * FROM entries
        WHERE rollId IN (SELECT id FROM rolls WHERE id = :rollId OR parentRollId = :rollId)
        ORDER BY date DESC
    """)
    fun getEntriesForRollAndSubRolls(rollId: Long): Flow<List<EntryEntity>>

    @Query("SELECT * FROM entries WHERE id = :id")
    suspend fun getById(id: Long): EntryEntity?

    @Query("""
        SELECT * FROM entries WHERE rollId = :rollId
        AND date BETWEEN :startDate AND :endDate
        ORDER BY date DESC
    """)
    fun getEntriesForRollInDateRange(rollId: Long, startDate: Long, endDate: Long): Flow<List<EntryEntity>>

    @Query("""
        SELECT SUM(cashOut - buyIn) FROM entries
        WHERE rollId IN (SELECT id FROM rolls WHERE id = :rollId OR parentRollId = :rollId)
    """)
    fun getTotalProfitForRoll(rollId: Long): Flow<Double?>

    @Query("""
        SELECT COUNT(*) FROM entries
        WHERE rollId IN (SELECT id FROM rolls WHERE id = :rollId OR parentRollId = :rollId)
    """)
    fun getEntryCountForRoll(rollId: Long): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: EntryEntity): Long

    @Update
    suspend fun update(entry: EntryEntity)

    @Delete
    suspend fun delete(entry: EntryEntity)

    @Query("DELETE FROM entries WHERE id = :id")
    suspend fun deleteById(id: Long)
}
