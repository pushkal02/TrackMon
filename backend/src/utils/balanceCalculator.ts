import { toDecimal, DecimalInstance } from "./decimal.js";

export interface TransactionBalanceInput {
  accountId?: number | string | null;
  toAccountId?: number | string | null;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  accountAmount?: string | number | DecimalInstance | any;
  toAccountAmount?: string | number | DecimalInstance | any;
  isScheduled?: boolean;
  isDeleted?: boolean;
}

export interface AccountBalanceInput {
  clientLocalId?: number;
  _id?: any;
  initialBalance: string | number | DecimalInstance | any;
}

/**
 * Computes the live balance for a single account based on the verified Track Wallet
 * dynamic formula recovered from wm6.b:
 *
 * Balance = initialBalance + sum(INCOME) - sum(EXPENSE) - sum(TRANSFER_OUT) + sum(TRANSFER_IN)
 */
export function computeAccountBalance(
  initialBalance: string | number | DecimalInstance | any,
  accountId: number | string,
  transactions: TransactionBalanceInput[]
): DecimalInstance {
  let balance = toDecimal(initialBalance);
  const targetIdStr = String(accountId);

  for (const tx of transactions) {
    if (tx.isScheduled || tx.isDeleted) {
      continue;
    }

    const txAccountIdStr = tx.accountId !== null && tx.accountId !== undefined ? String(tx.accountId) : null;
    const txToAccountIdStr = tx.toAccountId !== null && tx.toAccountId !== undefined ? String(tx.toAccountId) : null;

    if (tx.type === "INCOME" && txAccountIdStr === targetIdStr) {
      balance = balance.plus(toDecimal(tx.accountAmount));
    } else if (tx.type === "EXPENSE" && txAccountIdStr === targetIdStr) {
      balance = balance.minus(toDecimal(tx.accountAmount));
    } else if (tx.type === "TRANSFER") {
      // Outgoing transfer from this account
      if (txAccountIdStr === targetIdStr) {
        balance = balance.minus(toDecimal(tx.accountAmount));
      }
      // Incoming transfer to this account
      if (txToAccountIdStr === targetIdStr) {
        balance = balance.plus(toDecimal(tx.toAccountAmount));
      }
    }
  }

  return balance;
}
