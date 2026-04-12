package com.demo.app.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.demo.app.data.local.dao.RollDao
import com.demo.app.data.local.dao.EntryDao
import com.demo.app.data.local.entity.RollEntity
import com.demo.app.data.local.entity.EntryEntity

@Database(
    entities = [RollEntity::class, EntryEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun rollDao(): RollDao
    abstract fun entryDao(): EntryDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "bankroll_tracker_db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
