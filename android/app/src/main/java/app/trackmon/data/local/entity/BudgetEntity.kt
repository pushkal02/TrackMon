package app.trackmon.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "budgets")
data class BudgetEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val icon: String = "ic_budget_default",
    val color: String = "#2196f3",
    val amount: String,
    val accountFilters: String = "[]", // JSON string list
    val categoryFilters: String = "[]", // JSON string list
    val specificCategoryFilters: String = "[]",
    val startDate: String, // ISO date YYYY-MM-DD
    val period: String = "MONTHLY", // "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"
    val repeatInterval: Int = 1,
    val endDate: String? = null,
    val orderIndex: Int = 0
)
