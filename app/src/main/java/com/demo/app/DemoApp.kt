package com.demo.app

import android.app.Application
import com.demo.app.data.local.database.AppDatabase
import com.demo.app.data.repository.BankrollRepository

class DemoApp : Application() {

    val database by lazy { AppDatabase.getInstance(this) }
    val repository by lazy {
        BankrollRepository(database.rollDao(), database.entryDao())
    }
}
