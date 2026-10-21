package app.trackmon.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val details: String? = null,
    val type: String = "REGULAR", // "REGULAR", "CREDIT"
    val currencyCode: String,
    val initialBalance: String = "0.00",
    val creditLimit: String = "0.00",
    val icon: String = "ic_account_1",
    val color: String = "#26a69a",
    val isPrimary: Boolean = false,
    val isArchived: Boolean = false,
    val includeBalance: Boolean = true,
    val orderIndex: Int = 0
)
