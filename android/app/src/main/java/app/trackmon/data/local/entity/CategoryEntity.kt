package app.trackmon.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val type: String, // "EXPENSE", "INCOME"
    val name: String,
    val icon: String = "ic_category_default",
    val color: String = "#e91e63",
    val isArchived: Boolean = false,
    val orderIndex: Int = 0
)

@Serializable
@Entity(tableName = "subcategories")
data class SubcategoryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val categoryId: Long,
    val name: String,
    val icon: String = "ic_subcategory_default",
    val color: String = "#e91e63",
    val isArchived: Boolean = false,
    val orderIndex: Int = 0
)
