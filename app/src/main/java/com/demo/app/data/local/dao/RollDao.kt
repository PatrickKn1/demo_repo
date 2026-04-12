package com.demo.app.data.local.dao

import androidx.room.*
import com.demo.app.data.local.entity.RollEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RollDao {

    @Query("SELECT * FROM rolls WHERE parentRollId IS NULL ORDER BY createdAt DESC")
    fun getTopLevelRolls(): Flow<List<RollEntity>>

    @Query("SELECT * FROM rolls WHERE parentRollId = :parentId ORDER BY createdAt DESC")
    fun getSubRolls(parentId: Long): Flow<List<RollEntity>>

    @Query("SELECT * FROM rolls WHERE id = :id")
    suspend fun getById(id: Long): RollEntity?

    @Query("SELECT * FROM rolls WHERE id = :id")
    fun getByIdFlow(id: Long): Flow<RollEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(roll: RollEntity): Long

    @Update
    suspend fun update(roll: RollEntity)

    @Delete
    suspend fun delete(roll: RollEntity)

    @Query("DELETE FROM rolls WHERE id = :id")
    suspend fun deleteById(id: Long)
}
