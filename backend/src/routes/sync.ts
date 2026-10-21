import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { Account } from "../models/Account.js";
import { Transaction } from "../models/Transaction.js";
import { Category, Subcategory } from "../models/Category.js";
import { Budget } from "../models/Budget.js";
import { RecurringTransaction } from "../models/RecurringTransaction.js";
import { Template } from "../models/Template.js";
import { toDecimal128, formatDecimalString } from "../utils/decimal.js";

export const syncRouter = Router();

syncRouter.use(requireAuth);

/**
 * PULL: Fetch all entities modified after `since` timestamp
 */
syncRouter.get("/pull", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const sinceTimestamp = req.query.since ? new Date(parseInt(req.query.since as string, 10)) : new Date(0);

    const [accounts, transactions, categories, subcategories, budgets, recurring, templates] = await Promise.all([
      Account.find({ userId, updatedAt: { $gt: sinceTimestamp } }),
      Transaction.find({ userId, updatedAt: { $gt: sinceTimestamp } }),
      Category.find({ userId, updatedAt: { $gt: sinceTimestamp } }),
      Subcategory.find({ userId, updatedAt: { $gt: sinceTimestamp } }),
      Budget.find({ userId, updatedAt: { $gt: sinceTimestamp } }),
      RecurringTransaction.find({ userId, updatedAt: { $gt: sinceTimestamp } }),
      Template.find({ userId, updatedAt: { $gt: sinceTimestamp } }),
    ]);

    res.json({
      serverTimestamp: Date.now(),
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
        version: a.version,
        isDeleted: a.isDeleted,
        updatedAt: a.updatedAt.getTime(),
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
        isScheduled: t.isScheduled,
        version: t.version,
        isDeleted: t.isDeleted,
        updatedAt: t.updatedAt.getTime(),
      })),
      categories: categories.map((c) => ({
        id: c.clientLocalId,
        type: c.type,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isArchived: c.isArchived,
        orderIndex: c.orderIndex,
        version: c.version,
        isDeleted: c.isDeleted,
        updatedAt: c.updatedAt.getTime(),
      })),
      subcategories: subcategories.map((s) => ({
        id: s.clientLocalId,
        categoryId: s.categoryId,
        name: s.name,
        icon: s.icon,
        color: s.color,
        isArchived: s.isArchived,
        orderIndex: s.orderIndex,
        version: s.version,
        isDeleted: s.isDeleted,
        updatedAt: s.updatedAt.getTime(),
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
        version: b.version,
        isDeleted: b.isDeleted,
        updatedAt: b.updatedAt.getTime(),
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
        finishedCount: r.finishedCount,
        finishedDate: r.finishedDate,
        orderIndex: r.orderIndex,
        version: r.version,
        isDeleted: r.isDeleted,
        updatedAt: r.updatedAt.getTime(),
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
        version: tpl.version,
        isDeleted: tpl.isDeleted,
        updatedAt: tpl.updatedAt.getTime(),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * PUSH: Receive batch upserts from the Android client
 */
syncRouter.post("/push", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { accounts = [], transactions = [], categories = [], subcategories = [], budgets = [] } = req.body;

    // Process accounts
    for (const a of accounts) {
      await Account.findOneAndUpdate(
        { userId, clientLocalId: a.id },
        {
          userId,
          clientLocalId: a.id,
          name: a.name,
          details: a.details || null,
          type: a.type,
          currencyCode: a.currencyCode,
          initialBalance: toDecimal128(a.initialBalance),
          creditLimit: toDecimal128(a.creditLimit),
          icon: a.icon,
          color: a.color,
          isPrimary: Boolean(a.isPrimary),
          isArchived: Boolean(a.isArchived),
          includeBalance: a.includeBalance !== undefined ? Boolean(a.includeBalance) : true,
          orderIndex: a.orderIndex || 0,
          version: (a.version || 0) + 1,
          isDeleted: Boolean(a.isDeleted),
        },
        { upsert: true, new: true }
      );
    }

    // Process transactions
    for (const t of transactions) {
      await Transaction.findOneAndUpdate(
        { userId, clientLocalId: t.id },
        {
          userId,
          clientLocalId: t.id,
          timestamp: new Date(t.timestamp),
          type: t.type,
          mainCurrencyAmount: toDecimal128(t.mainCurrencyAmount || t.accountAmount),
          accountId: t.accountId ? Number(t.accountId) : null,
          accountAmount: t.accountAmount ? toDecimal128(t.accountAmount) : null,
          toAccountId: t.toAccountId ? Number(t.toAccountId) : null,
          toAccountAmount: t.toAccountAmount ? toDecimal128(t.toAccountAmount) : null,
          note: t.note || null,
          categoryId: t.categoryId ? Number(t.categoryId) : null,
          subcategoryId: t.subcategoryId ? Number(t.subcategoryId) : null,
          recurringTransactionId: t.recurringTransactionId ? Number(t.recurringTransactionId) : null,
          isScheduled: Boolean(t.isScheduled),
          version: (t.version || 0) + 1,
          isDeleted: Boolean(t.isDeleted),
        },
        { upsert: true, new: true }
      );
    }

    // Process categories
    for (const c of categories) {
      await Category.findOneAndUpdate(
        { userId, clientLocalId: c.id },
        {
          userId,
          clientLocalId: c.id,
          type: c.type,
          name: c.name,
          icon: c.icon,
          color: c.color,
          isArchived: Boolean(c.isArchived),
          orderIndex: c.orderIndex || 0,
          version: (c.version || 0) + 1,
          isDeleted: Boolean(c.isDeleted),
        },
        { upsert: true, new: true }
      );
    }

    // Process subcategories
    for (const s of subcategories) {
      await Subcategory.findOneAndUpdate(
        { userId, clientLocalId: s.id },
        {
          userId,
          clientLocalId: s.id,
          categoryId: Number(s.categoryId),
          name: s.name,
          icon: s.icon,
          color: s.color,
          isArchived: Boolean(s.isArchived),
          orderIndex: s.orderIndex || 0,
          version: (s.version || 0) + 1,
          isDeleted: Boolean(s.isDeleted),
        },
        { upsert: true, new: true }
      );
    }

    // Process budgets
    for (const b of budgets) {
      await Budget.findOneAndUpdate(
        { userId, clientLocalId: b.id },
        {
          userId,
          clientLocalId: b.id,
          name: b.name,
          icon: b.icon,
          color: b.color,
          amount: toDecimal128(b.amount),
          accountFilters: b.accountFilters || [],
          categoryFilters: b.categoryFilters || [],
          specificCategoryFilters: b.specificCategoryFilters || [],
          startDate: b.startDate,
          period: b.period || "MONTHLY",
          repeatInterval: b.repeatInterval || 1,
          endDate: b.endDate || null,
          orderIndex: b.orderIndex || 0,
          version: (b.version || 0) + 1,
          isDeleted: Boolean(b.isDeleted),
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, processedAt: Date.now() });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});
