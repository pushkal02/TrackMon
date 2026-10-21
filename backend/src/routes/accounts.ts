import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { Account } from "../models/Account.js";
import { Transaction } from "../models/Transaction.js";
import { computeAccountBalance } from "../utils/balanceCalculator.js";
import { toDecimal128, formatDecimalString } from "../utils/decimal.js";

export const accountsRouter = Router();

accountsRouter.use(requireAuth);

accountsRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const accounts = await Account.find({ userId, isDeleted: false }).sort({ orderIndex: 1 });
    const transactions = await Transaction.find({ userId, isDeleted: false, isScheduled: false }).lean();

    const result = accounts.map((acc) => {
      const balance = computeAccountBalance(acc.initialBalance, acc.clientLocalId, transactions as any);
      return {
        id: acc.clientLocalId,
        _id: acc._id.toString(),
        name: acc.name,
        details: acc.details,
        type: acc.type,
        currencyCode: acc.currencyCode,
        initialBalance: formatDecimalString(acc.initialBalance),
        creditLimit: formatDecimalString(acc.creditLimit),
        currentBalance: balance.toFixed(2),
        icon: acc.icon,
        color: acc.color,
        isPrimary: acc.isPrimary,
        isArchived: acc.isArchived,
        includeBalance: acc.includeBalance,
        orderIndex: acc.orderIndex,
        version: acc.version,
        updatedAt: acc.updatedAt,
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

accountsRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      details,
      type = "REGULAR",
      currencyCode = "USD",
      initialBalance = "0.00",
      creditLimit = "0.00",
      icon = "ic_account_1",
      color = "#26a69a",
      isPrimary = false,
      isArchived = false,
      includeBalance = true,
      clientLocalId,
    } = req.body;

    if (!name || name.trim() === "") {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Account name is required." });
      return;
    }

    // Auto-generate clientLocalId if not provided (e.g. max + 1)
    let assignedLocalId = clientLocalId;
    if (assignedLocalId === undefined || assignedLocalId === null) {
      const highest = await Account.findOne({ userId }).sort({ clientLocalId: -1 });
      assignedLocalId = (highest?.clientLocalId || 0) + 1;
    }

    // If isPrimary is true, unset other primary accounts
    if (isPrimary) {
      await Account.updateMany({ userId, isPrimary: true }, { isPrimary: false });
    }

    const maxOrder = await Account.findOne({ userId }).sort({ orderIndex: -1 });
    const orderIndex = (maxOrder?.orderIndex ?? -1) + 1;

    const account = new Account({
      userId,
      clientLocalId: assignedLocalId,
      name: name.trim(),
      details: details || null,
      type,
      currencyCode: currencyCode.toUpperCase(),
      initialBalance: toDecimal128(initialBalance),
      creditLimit: toDecimal128(creditLimit),
      icon,
      color,
      isPrimary,
      isArchived,
      includeBalance,
      orderIndex,
      version: 1,
      isDeleted: false,
    });

    await account.save();

    res.status(201).json({
      id: account.clientLocalId,
      _id: account._id.toString(),
      name: account.name,
      details: account.details,
      type: account.type,
      currencyCode: account.currencyCode,
      initialBalance: formatDecimalString(account.initialBalance),
      creditLimit: formatDecimalString(account.creditLimit),
      currentBalance: formatDecimalString(account.initialBalance),
      icon: account.icon,
      color: account.color,
      isPrimary: account.isPrimary,
      isArchived: account.isArchived,
      includeBalance: account.includeBalance,
      orderIndex: account.orderIndex,
      version: account.version,
      updatedAt: account.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

accountsRouter.put("/:clientLocalId", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const clientLocalId = parseInt(String(req.params.clientLocalId), 10);
    const {
      name,
      details,
      type,
      currencyCode,
      initialBalance,
      creditLimit,
      icon,
      color,
      isPrimary,
      isArchived,
      includeBalance,
      orderIndex,
    } = req.body;

    const account = await Account.findOne({ userId, clientLocalId, isDeleted: false });
    if (!account) {
      res.status(404).json({ error: "NOT_FOUND", message: "Account not found." });
      return;
    }

    if (name !== undefined) account.name = name.trim();
    if (details !== undefined) account.details = details;
    if (type !== undefined) account.type = type;
    if (currencyCode !== undefined) account.currencyCode = currencyCode.toUpperCase();
    if (initialBalance !== undefined) account.initialBalance = toDecimal128(initialBalance)!;
    if (creditLimit !== undefined) account.creditLimit = toDecimal128(creditLimit)!;
    if (icon !== undefined) account.icon = icon;
    if (color !== undefined) account.color = color;
    if (includeBalance !== undefined) account.includeBalance = includeBalance;
    if (isArchived !== undefined) account.isArchived = isArchived;
    if (orderIndex !== undefined) account.orderIndex = orderIndex;

    if (isPrimary === true) {
      await Account.updateMany({ userId, isPrimary: true }, { isPrimary: false });
      account.isPrimary = true;
    } else if (isPrimary === false) {
      account.isPrimary = false;
    }

    account.version += 1;
    await account.save();

    res.json({
      id: account.clientLocalId,
      _id: account._id.toString(),
      name: account.name,
      details: account.details,
      type: account.type,
      currencyCode: account.currencyCode,
      initialBalance: formatDecimalString(account.initialBalance),
      creditLimit: formatDecimalString(account.creditLimit),
      icon: account.icon,
      color: account.color,
      isPrimary: account.isPrimary,
      isArchived: account.isArchived,
      includeBalance: account.includeBalance,
      orderIndex: account.orderIndex,
      version: account.version,
      updatedAt: account.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

accountsRouter.delete("/:clientLocalId", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const clientLocalId = parseInt(String(req.params.clientLocalId), 10);

    const account = await Account.findOne({ userId, clientLocalId, isDeleted: false });
    if (!account) {
      res.status(404).json({ error: "NOT_FOUND", message: "Account not found." });
      return;
    }

    // Soft delete for sync integrity
    account.isDeleted = true;
    account.version += 1;
    await account.save();

    res.json({ success: true, message: "Account deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});
