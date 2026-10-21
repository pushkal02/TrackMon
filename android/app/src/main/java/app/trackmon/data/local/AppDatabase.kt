package app.trackmon.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import app.trackmon.data.local.dao.*
import app.trackmon.data.local.entity.*

@Database(
    entities = [
        AccountEntity::class,
        TransactionEntity::class,
        CategoryEntity::class,
        SubcategoryEntity::class,
        BudgetEntity::class,
        RecurringTransactionEntity::class,
        TemplateEntity::class,
        ExchangeRatesEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun accountDao(): AccountDao
    abstract fun transactionDao(): TransactionDao
}
