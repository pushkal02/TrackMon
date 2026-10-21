package app.trackmon.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "recurring_transactions")
data class RecurringTransactionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val transactionType: String, // "EXPENSE", "INCOME", "TRANSFER"
    val amount: String,
    val accountId: Long,
    val categoryId: Long? = null,
    val subcategoryId: Long? = null,
    val transferToAccountId: Long? = null,
    val note: String? = null,
    val repeatPeriod: String, // "DAILY", "WEEKLY", "MONTHLY", "YEARLY"
    val repeatInterval: Int = 1,
    val endType: String = "NEVER", // "NEVER", "DATE", "COUNT"
    val endDate: String? = null,
    val endCount: Int? = null,
    val autoConfirmation: Boolean = false,
    val scheduledDate: Long,
    val finishedCount: Int = 0,
    val finishedDate: Long? = null,
    val orderIndex: Int = 0
)

@Serializable
@Entity(tableName = "templates")
data class TemplateEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String? = null,
    val type: String,
    val amount: String? = null,
    val accountId: Long? = null,
    val transferToAccountId: Long? = null,
    val categoryId: Long? = null,
    val subcategoryId: Long? = null,
    val note: String? = null,
    val orderIndex: Int = 0
)

@Serializable
@Entity(tableName = "exchange_rates")
data class ExchangeRatesEntity(
    @PrimaryKey
    val date: String, // YYYY-MM-DD
    val baseCurrencyCode: String,
    val rates: String // JSON map string
)
