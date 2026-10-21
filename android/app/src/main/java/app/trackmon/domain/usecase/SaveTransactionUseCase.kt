package app.trackmon.domain.usecase

import app.trackmon.data.local.dao.TransactionDao
import app.trackmon.data.local.entity.TransactionEntity
import java.math.BigDecimal

sealed class SaveTransactionResult {
    data class Success(val transactionId: Long) : SaveTransactionResult()
    data class Error(val message: String) : SaveTransactionResult()
}

/**
 * Reconstructed transaction save use-case based on defpackage.fs0 and BuildTransferTransactionCase.
 */
class SaveTransactionUseCase(
    private val transactionDao: TransactionDao
) {
    suspend operator fun invoke(
        id: Long = 0,
        timestamp: Long = System.currentTimeMillis(),
        type: String, // "INCOME", "EXPENSE", "TRANSFER"
        mainCurrencyAmount: String,
        accountId: Long?,
        accountAmount: String?,
        toAccountId: Long? = null,
        toAccountAmount: String? = null,
        note: String? = null,
        categoryId: Long? = null,
        subcategoryId: Long? = null,
        recurringTransactionId: Long? = null,
        isScheduled: Boolean = false
    ): SaveTransactionResult {
        if (type == "TRANSFER") {
            if (accountId == null || toAccountId == null) {
                return SaveTransactionResult.Error("Both source and destination accounts are required for a transfer.")
            }
            if (accountId == toAccountId) {
                return SaveTransactionResult.Error("Source and destination accounts cannot be identical.")
            }
            val srcAmount = try { BigDecimal(accountAmount ?: "0") } catch (_: Exception) { BigDecimal.ZERO }
            if (srcAmount <= BigDecimal.ZERO) {
                return SaveTransactionResult.Error("Transfer amount must be greater than zero.")
            }
        } else {
            if (accountId == null) {
                return SaveTransactionResult.Error("Account is required.")
            }
            val amount = try { BigDecimal(accountAmount ?: "0") } catch (_: Exception) { BigDecimal.ZERO }
            if (amount <= BigDecimal.ZERO) {
                return SaveTransactionResult.Error("Transaction amount must be greater than zero.")
            }
        }

        val entity = TransactionEntity(
            id = id,
            timestamp = timestamp,
            type = type,
            mainCurrencyAmount = mainCurrencyAmount.ifEmpty { accountAmount ?: "0.00" },
            accountId = accountId,
            accountAmount = accountAmount,
            toAccountId = if (type == "TRANSFER") toAccountId else null,
            toAccountAmount = if (type == "TRANSFER") (toAccountAmount ?: accountAmount) else null,
            note = note,
            categoryId = if (type == "TRANSFER") null else categoryId,
            subcategoryId = if (type == "TRANSFER") null else subcategoryId,
            recurringTransactionId = recurringTransactionId,
            isScheduled = isScheduled
        )

        val insertedId = transactionDao.insertOrUpdate(entity)
        return SaveTransactionResult.Success(insertedId)
    }
}
