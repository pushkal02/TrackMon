package app.trackmon.domain.usecase

import app.trackmon.data.local.dao.TransactionDao
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Computes dynamic account balance directly adhering to the verified decompiled formula in wm6.b:
 *
 * Balance = initialBalance + sum(INCOME) - sum(EXPENSE) - sum(TRANSFER_OUT) + sum(TRANSFER_IN)
 *
 * All calculations use BigDecimal with RoundingMode.HALF_UP to preserve decimal financial precision.
 */
class ComputeAccountBalanceUseCase(
    private val transactionDao: TransactionDao
) {
    suspend operator fun invoke(accountId: Long, initialBalanceStr: String): BigDecimal {
        var balance = try {
            BigDecimal(initialBalanceStr)
        } catch (_: Exception) {
            BigDecimal.ZERO
        }

        // 1. Regular Income and Expense
        val regularTxs = transactionDao.getIncomeExpenseForAccount(accountId)
        for (tx in regularTxs) {
            val amount = try { BigDecimal(tx.accountAmount) } catch (_: Exception) { BigDecimal.ZERO }
            if (tx.type == "INCOME") {
                balance = balance.add(amount)
            } else if (tx.type == "EXPENSE") {
                balance = balance.subtract(amount)
            }
        }

        // 2. Outgoing Transfers from this account
        val outgoing = transactionDao.getOutgoingTransfersForAccount(accountId)
        for (tx in outgoing) {
            val amount = try { BigDecimal(tx.amount) } catch (_: Exception) { BigDecimal.ZERO }
            balance = balance.subtract(amount)
        }

        // 3. Incoming Transfers to this account
        val incoming = transactionDao.getIncomingTransfersForAccount(accountId)
        for (tx in incoming) {
            val amount = try { BigDecimal(tx.amount) } catch (_: Exception) { BigDecimal.ZERO }
            balance = balance.add(amount)
        }

        return balance.setScale(2, RoundingMode.HALF_UP)
    }
}
