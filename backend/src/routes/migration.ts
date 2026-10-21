import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { Account } from "../models/Account.js";
import { Transaction } from "../models/Transaction.js";
import { Category, Subcategory } from "../models/Category.js";
import { Budget } from "../models/Budget.js";
import { RecurringTransaction } from "../models/RecurringTransaction.js";
import { Template } from "../models/Template.js";
import { toDecimal128, formatDecimalString } from "../utils/decimal.js";

export const migrationRouter = Router();

migrationRouter.use(requireAuth);

/**
 * Full export of user's database as JSON
 */
migrationRouter.get("/export-json", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [accounts, transactions, categories, subcategories, budgets, recurring, templates] = await Promise.all([
      Account.find({ userId, isDeleted: false }),
      Transaction.find({ userId, isDeleted: false }),
      Category.find({ userId, isDeleted: false }),
      Subcategory.find({ userId, isDeleted: false }),
      Budget.find({ userId, isDeleted: false }),
      RecurringTransaction.find({ userId, isDeleted: false }),
      Template.find({ userId, isDeleted: false }),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      version: 1,
      accounts: accounts.map((a) => ({
        id: a.clientLocalId,
        name: a.name,
        details: a.details,
        type: a.type,
        currencyCode: a.currencyCode,
        initialBalance: formatDecimalString(a.initialBalance),
        creditLimit: formatDecimalString(a.creditLimit),
        icon: a.icon,
        color: a.color,
        isPrimary: a.isPrimary,
        isArchived: a.isArchived,
        includeBalance: a.includeBalance,
        orderIndex: a.orderIndex,
      })),
      transactions: transactions.map((t) => ({
        id: t.clientLocalId,
        timestamp: t.timestamp.getTime(),
        type: t.type,
        mainCurrencyAmount: formatDecimalString(t.mainCurrencyAmount),
        accountId: t.accountId,
        accountAmount: t.accountAmount ? formatDecimalString(t.accountAmount) : null,
        toAccountId: t.toAccountId,
        toAccountAmount: t.toAccountAmount ? formatDecimalString(t.toAccountAmount) : null,
        note: t.note,
        categoryId: t.categoryId,
        subcategoryId: t.subcategoryId,
        recurringTransactionId: t.recurringTransactionId,
      })),
      categories: categories.map((c) => ({
        id: c.clientLocalId,
        type: c.type,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isArchived: c.isArchived,
        orderIndex: c.orderIndex,
      })),
      subcategories: subcategories.map((s) => ({
        id: s.clientLocalId,
        categoryId: s.categoryId,
        name: s.name,
        icon: s.icon,
        color: s.color,
        isArchived: s.isArchived,
        orderIndex: s.orderIndex,
      })),
      budgets: budgets.map((b) => ({
        id: b.clientLocalId,
        name: b.name,
        icon: b.icon,
        color: b.color,
        amount: formatDecimalString(b.amount),
        accountFilters: b.accountFilters,
        categoryFilters: b.categoryFilters,
        specificCategoryFilters: b.specificCategoryFilters,
        startDate: b.startDate,
        period: b.period,
        repeatInterval: b.repeatInterval,
        endDate: b.endDate,
        orderIndex: b.orderIndex,
      })),
      recurring: recurring.map((r) => ({
        id: r.clientLocalId,
        transactionType: r.transactionType,
        amount: formatDecimalString(r.amount),
        accountId: r.accountId,
        categoryId: r.categoryId,
        subcategoryId: r.subcategoryId,
        transferToAccountId: r.transferToAccountId,
        note: r.note,
        repeatPeriod: r.repeatPeriod,
        repeatInterval: r.repeatInterval,
        endType: r.endType,
        endDate: r.endDate,
        endCount: r.endCount,
        autoConfirmation: r.autoConfirmation,
        scheduledDate: r.scheduledDate,
      })),
      templates: templates.map((tpl) => ({
        id: tpl.clientLocalId,
        name: tpl.name,
        type: tpl.type,
        amount: tpl.amount ? formatDecimalString(tpl.amount) : null,
        accountId: tpl.accountId,
        transferToAccountId: tpl.transferToAccountId,
        categoryId: tpl.categoryId,
        subcategoryId: tpl.subcategoryId,
        note: tpl.note,
        orderIndex: tpl.orderIndex,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * Import JSON backup into user's account
 */
migrationRouter.post("/import-json", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { accounts = [], transactions = [], categories = [], subcategories = [], budgets = [] } = req.body;

    let importedAccounts = 0;
    let importedTransactions = 0;

    for (const a of accounts) {
      await Account.findOneAndUpdate(
        { userId, clientLocalId: a.id },
        {
          userId,
          clientLocalId: a.id,
          name: a.name,
          details: a.details || null,
          type: a.type || "REGULAR",
          currencyCode: a.currencyCode || "USD",
          initialBalance: toDecimal128(a.initialBalance || "0.00"),
          creditLimit: toDecimal128(a.creditLimit || "0.00"),
          icon: a.icon || "ic_account_1",
          color: a.color || "#26a69a",
          isPrimary: Boolean(a.isPrimary),
          isArchived: Boolean(a.isArchived),
          includeBalance: a.includeBalance !== undefined ? Boolean(a.includeBalance) : true,
          orderIndex: a.orderIndex || 0,
          version: 1,
          isDeleted: false,
        },
        { upsert: true }
      );
      importedAccounts++;
    }

    for (const c of categories) {
      await Category.findOneAndUpdate(
        { userId, clientLocalId: c.id },
        {
          userId,
          clientLocalId: c.id,
          type: c.type || "EXPENSE",
          name: c.name,
          icon: c.icon || "ic_category_default",
          color: c.color || "#e91e63",
          isArchived: Boolean(c.isArchived),
          orderIndex: c.orderIndex || 0,
          version: 1,
          isDeleted: false,
        },
        { upsert: true }
      );
    }

    for (const s of subcategories) {
      await Subcategory.findOneAndUpdate(
        { userId, clientLocalId: s.id },
        {
          userId,
          clientLocalId: s.id,
          categoryId: Number(s.categoryId),
          name: s.name,
          icon: s.icon || "ic_subcategory_default",
          color: s.color || "#e91e63",
          isArchived: Boolean(s.isArchived),
          orderIndex: s.orderIndex || 0,
          version: 1,
          isDeleted: false,
        },
        { upsert: true }
      );
    }

    for (const t of transactions) {
      await Transaction.findOneAndUpdate(
        { userId, clientLocalId: t.id },
        {
          userId,
          clientLocalId: t.id,
          timestamp: new Date(t.timestamp),
          type: t.type,
          mainCurrencyAmount: toDecimal128(t.mainCurrencyAmount || t.accountAmount || "0.00"),
          accountId: t.accountId ? Number(t.accountId) : null,
          accountAmount: t.accountAmount ? toDecimal128(t.accountAmount) : null,
          toAccountId: t.toAccountId ? Number(t.toAccountId) : null,
          toAccountAmount: t.toAccountAmount ? toDecimal128(t.toAccountAmount) : null,
          note: t.note || null,
          categoryId: t.categoryId ? Number(t.categoryId) : null,
          subcategoryId: t.subcategoryId ? Number(t.subcategoryId) : null,
          recurringTransactionId: t.recurringTransactionId ? Number(t.recurringTransactionId) : null,
          isScheduled: false,
          version: 1,
          isDeleted: false,
        },
        { upsert: true }
      );
      importedTransactions++;
    }

    res.json({
      success: true,
      message: `Import completed: ${importedAccounts} accounts, ${importedTransactions} transactions processed.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});
