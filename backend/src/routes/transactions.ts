import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";
import { toDecimal128, formatDecimalString, toDecimal } from "../utils/decimal.js";

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      startDate,
      endDate,
      accountId,
      categoryId,
      type,
      limit = "100",
      skip = "0",
    } = req.query;

    const query: any = { userId, isDeleted: false };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    if (type) {
      query.type = type;
    }

    if (accountId) {
      const accId = parseInt(accountId as string, 10);
      query.$or = [{ accountId: accId }, { toAccountId: accId }];
    }

    if (categoryId) {
      query.categoryId = parseInt(categoryId as string, 10);
    }

    const txs = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(skip as string, 10))
      .limit(parseInt(limit as string, 10));

    const total = await Transaction.countDocuments(query);

    const result = txs.map((t) => ({
      id: t.clientLocalId,
      _id: t._id.toString(),
      timestamp: t.timestamp.getTime(),
      isoDate: t.timestamp.toISOString(),
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
      updatedAt: t.updatedAt,
    }));

    res.json({ total, data: result });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

transactionsRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      timestamp,
      type,
      mainCurrencyAmount,
      accountId,
      accountAmount,
      toAccountId,
      toAccountAmount,
      note,
      categoryId,
      subcategoryId,
      recurringTransactionId,
      isScheduled = false,
      clientLocalId,
    } = req.body;

    if (!type || !["INCOME", "EXPENSE", "TRANSFER"].includes(type)) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Valid transaction type (INCOME, EXPENSE, TRANSFER) is required.",
      });
      return;
    }

    // Business validation based on recovered domain rules:
    if (type === "TRANSFER") {
      if (accountId === undefined || accountId === null || toAccountId === undefined || toAccountId === null) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Transfer requires both source accountId and destination toAccountId.",
        });
        return;
      }
      if (Number(accountId) === Number(toAccountId)) {
        res.status(400).json({
          error: "ACCOUNTS_MATCH",
          message: "Source account and destination account cannot be the same.",
        });
        return;
      }
      if (!accountAmount || toDecimal(accountAmount).isZero()) {
        res.status(400).json({
          error: "INVALID_AMOUNT",
          message: "Transfer source account amount must be greater than zero.",
        });
        return;
      }
    } else {
      if (accountId === undefined || accountId === null) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Transaction requires accountId.",
        });
        return;
      }
      if (!accountAmount || toDecimal(accountAmount).isZero()) {
        res.status(400).json({
          error: "INVALID_AMOUNT",
          message: "Transaction amount must be greater than zero.",
        });
        return;
      }
    }

    // Auto-generate clientLocalId if not supplied
    let assignedLocalId = clientLocalId;
    if (assignedLocalId === undefined || assignedLocalId === null) {
      const highest = await Transaction.findOne({ userId }).sort({ clientLocalId: -1 });
      assignedLocalId = (highest?.clientLocalId || 0) + 1;
    }

    const txDate = timestamp ? new Date(timestamp) : new Date();
    const finalMainAmount = mainCurrencyAmount || accountAmount;

    const tx = new Transaction({
      userId,
      clientLocalId: assignedLocalId,
      timestamp: txDate,
      type,
      mainCurrencyAmount: toDecimal128(finalMainAmount),
      accountId: Number(accountId),
      accountAmount: toDecimal128(accountAmount),
      toAccountId: type === "TRANSFER" ? Number(toAccountId) : null,
      toAccountAmount: type === "TRANSFER" ? toDecimal128(toAccountAmount || accountAmount) : null,
      note: note || null,
      categoryId: type === "TRANSFER" ? null : (categoryId !== undefined && categoryId !== null ? Number(categoryId) : null),
      subcategoryId: type === "TRANSFER" ? null : (subcategoryId !== undefined && subcategoryId !== null ? Number(subcategoryId) : null),
      recurringTransactionId: recurringTransactionId ? Number(recurringTransactionId) : null,
      isScheduled: Boolean(isScheduled),
      version: 1,
      isDeleted: false,
    });

    await tx.save();

    res.status(201).json({
      id: tx.clientLocalId,
      _id: tx._id.toString(),
      timestamp: tx.timestamp.getTime(),
      isoDate: tx.timestamp.toISOString(),
      type: tx.type,
      mainCurrencyAmount: formatDecimalString(tx.mainCurrencyAmount),
      accountId: tx.accountId,
      accountAmount: tx.accountAmount ? formatDecimalString(tx.accountAmount) : null,
      toAccountId: tx.toAccountId,
      toAccountAmount: tx.toAccountAmount ? formatDecimalString(tx.toAccountAmount) : null,
      note: tx.note,
      categoryId: tx.categoryId,
      subcategoryId: tx.subcategoryId,
      recurringTransactionId: tx.recurringTransactionId,
      isScheduled: tx.isScheduled,
      version: tx.version,
      updatedAt: tx.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

transactionsRouter.put("/:clientLocalId", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const clientLocalId = parseInt(String(req.params.clientLocalId), 10);
    const updates = req.body;

    const tx = await Transaction.findOne({ userId, clientLocalId, isDeleted: false });
    if (!tx) {
      res.status(404).json({ error: "NOT_FOUND", message: "Transaction not found." });
      return;
    }

    if (updates.type) tx.type = updates.type;
    if (updates.timestamp) tx.timestamp = new Date(updates.timestamp);
    if (updates.accountId !== undefined) tx.accountId = updates.accountId;
    if (updates.accountAmount !== undefined) tx.accountAmount = toDecimal128(updates.accountAmount);
    if (updates.toAccountId !== undefined) tx.toAccountId = updates.toAccountId;
    if (updates.toAccountAmount !== undefined) tx.toAccountAmount = toDecimal128(updates.toAccountAmount);
    if (updates.mainCurrencyAmount !== undefined) tx.mainCurrencyAmount = toDecimal128(updates.mainCurrencyAmount)!;
    if (updates.note !== undefined) tx.note = updates.note;
    if (updates.categoryId !== undefined) tx.categoryId = updates.categoryId;
    if (updates.subcategoryId !== undefined) tx.subcategoryId = updates.subcategoryId;
    if (updates.isScheduled !== undefined) tx.isScheduled = updates.isScheduled;

    // Consistency check on transfer
    if (tx.type === "TRANSFER") {
      if (tx.accountId === tx.toAccountId) {
        res.status(400).json({ error: "ACCOUNTS_MATCH", message: "Source and destination accounts cannot match." });
        return;
      }
      tx.categoryId = null;
      tx.subcategoryId = null;
    }

    tx.version += 1;
    await tx.save();

    res.json({
      id: tx.clientLocalId,
      _id: tx._id.toString(),
      timestamp: tx.timestamp.getTime(),
      type: tx.type,
      mainCurrencyAmount: formatDecimalString(tx.mainCurrencyAmount),
      accountId: tx.accountId,
      accountAmount: tx.accountAmount ? formatDecimalString(tx.accountAmount) : null,
      toAccountId: tx.toAccountId,
      toAccountAmount: tx.toAccountAmount ? formatDecimalString(tx.toAccountAmount) : null,
      note: tx.note,
      categoryId: tx.categoryId,
      subcategoryId: tx.subcategoryId,
      isScheduled: tx.isScheduled,
      version: tx.version,
      updatedAt: tx.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

transactionsRouter.delete("/:clientLocalId", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const clientLocalId = parseInt(String(req.params.clientLocalId), 10);

    const tx = await Transaction.findOne({ userId, clientLocalId, isDeleted: false });
    if (!tx) {
      res.status(404).json({ error: "NOT_FOUND", message: "Transaction not found." });
      return;
    }

    tx.isDeleted = true;
    tx.version += 1;
    await tx.save();

    res.json({ success: true, message: "Transaction deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});
