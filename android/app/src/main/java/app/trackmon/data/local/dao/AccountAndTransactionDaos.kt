package app.trackmon.data.local.dao

import androidx.room.*
import app.trackmon.data.local.entity.AccountEntity
import app.trackmon.data.local.entity.TransactionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AccountDao {
    @Query("SELECT * FROM accounts ORDER BY isArchived, orderIndex")
    fun getAllAccounts(): Flow<List<AccountEntity>>

    @Query("SELECT * FROM accounts WHERE isArchived = 0 ORDER BY isPrimary DESC, orderIndex")
    fun getActiveAccounts(): Flow<List<AccountEntity>>

    @Query("SELECT * FROM accounts WHERE id = :id")
    suspend fun getAccountById(id: Long): AccountEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(account: AccountEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(accounts: List<AccountEntity>)

    @Delete
    suspend fun delete(account: AccountEntity)

    @Query("SELECT COUNT(*) FROM accounts")
    suspend fun count(): Int
}

data class TypeAmount(
    val type: String,
    val accountAmount: String
)

data class SingleAmount(
    val amount: String
)

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions ORDER BY timestamp DESC")
    fun getAllTransactions(): Flow<List<TransactionEntity>>

    @Query("SELECT * FROM transactions WHERE id = :id")
    suspend fun getTransactionById(id: Long): TransactionEntity?

    @Query("SELECT * FROM transactions WHERE timestamp BETWEEN :startTime AND :endTime ORDER BY timestamp DESC")
    fun getTransactionsInRange(startTime: Long, endTime: Long): Flow<List<TransactionEntity>>

    @Query("SELECT * FROM transactions WHERE accountId = :accountId OR toAccountId = :accountId ORDER BY timestamp DESC")
    fun getTransactionsForAccount(accountId: Long): Flow<List<TransactionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(transaction: TransactionEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(transactions: List<TransactionEntity>)

    @Delete
    suspend fun delete(transaction: TransactionEntity)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteById(id: Long)

    // Dynamic Balance Calculation Queries (wm6.b)
    @Query("SELECT type, accountAmount FROM transactions WHERE accountId = :accountId AND isScheduled = 0 AND type IN ('INCOME', 'EXPENSE')")
    suspend fun getIncomeExpenseForAccount(accountId: Long): List<TypeAmount>

    @Query("SELECT accountAmount as amount FROM transactions WHERE accountId = :accountId AND isScheduled = 0 AND type = 'TRANSFER'")
    suspend fun getOutgoingTransfersForAccount(accountId: Long): List<SingleAmount>

    @Query("SELECT toAccountAmount as amount FROM transactions WHERE toAccountId = :accountId AND isScheduled = 0 AND type = 'TRANSFER'")
    suspend fun getIncomingTransfersForAccount(accountId: Long): List<SingleAmount>
}
