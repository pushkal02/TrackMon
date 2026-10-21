package app.trackmon.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
@Entity(
    tableName = "transactions",
    indices = [
        Index(value = ["timestamp"]),
        Index(value = ["accountId"]),
        Index(value = ["toAccountId"])
    ]
)
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val timestamp: Long, // Epoch ms
    val type: String, // "INCOME", "EXPENSE", "TRANSFER"
    val mainCurrencyAmount: String,
    val accountId: Long? = null,
    val accountAmount: String? = null,
    val toAccountId: Long? = null,
    val toAccountAmount: String? = null,
    val note: String? = null,
    val categoryId: Long? = null,
    val subcategoryId: Long? = null,
    val recurringTransactionId: Long? = null,
    val isScheduled: Boolean = false
)
