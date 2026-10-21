import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { RecurringTransaction } from "../models/RecurringTransaction.js";
import { Template } from "../models/Template.js";
import { toDecimal128, formatDecimalString } from "../utils/decimal.js";

export const recurringRouter = Router();

recurringRouter.use(requireAuth);

recurringRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const items = await RecurringTransaction.find({ userId, isDeleted: false }).sort({ orderIndex: 1 });

    const result = items.map((r) => ({
      id: r.clientLocalId,
      _id: r._id.toString(),
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
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

recurringRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      transactionType,
      amount,
      accountId,
      categoryId,
      subcategoryId,
      transferToAccountId,
      note,
      repeatPeriod,
      repeatInterval = 1,
      endType = "NEVER",
      endDate = null,
      endCount = null,
      autoConfirmation = false,
      scheduledDate,
      clientLocalId,
    } = req.body;

    if (!transactionType || !amount || accountId === undefined || !repeatPeriod || scheduledDate === undefined) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "transactionType, amount, accountId, repeatPeriod, and scheduledDate are required.",
      });
      return;
    }

    let assignedLocalId = clientLocalId;
    if (assignedLocalId === undefined || assignedLocalId === null) {
      const highest = await RecurringTransaction.findOne({ userId }).sort({ clientLocalId: -1 });
      assignedLocalId = (highest?.clientLocalId || 0) + 1;
    }

    const item = new RecurringTransaction({
      userId,
      clientLocalId: assignedLocalId,
      transactionType,
      amount: toDecimal128(amount),
      accountId: Number(accountId),
      categoryId: categoryId ? Number(categoryId) : null,
      subcategoryId: subcategoryId ? Number(subcategoryId) : null,
      transferToAccountId: transferToAccountId ? Number(transferToAccountId) : null,
      note: note || null,
      repeatPeriod,
      repeatInterval: Number(repeatInterval),
      endType,
      endDate,
      endCount: endCount ? Number(endCount) : null,
      autoConfirmation: Boolean(autoConfirmation),
      scheduledDate: Number(scheduledDate),
      finishedCount: 0,
      finishedDate: null,
      orderIndex: 0,
      version: 1,
      isDeleted: false,
    });

    await item.save();

    res.status(201).json({
      id: item.clientLocalId,
      _id: item._id.toString(),
      transactionType: item.transactionType,
      amount: formatDecimalString(item.amount),
      accountId: item.accountId,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      transferToAccountId: item.transferToAccountId,
      note: item.note,
      repeatPeriod: item.repeatPeriod,
      repeatInterval: item.repeatInterval,
      endType: item.endType,
      endDate: item.endDate,
      endCount: item.endCount,
      autoConfirmation: item.autoConfirmation,
      scheduledDate: item.scheduledDate,
      finishedCount: item.finishedCount,
      finishedDate: item.finishedDate,
      orderIndex: item.orderIndex,
      version: item.version,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// Templates
recurringRouter.get("/templates", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const items = await Template.find({ userId, isDeleted: false }).sort({ orderIndex: 1 });

    const result = items.map((t) => ({
      id: t.clientLocalId,
      _id: t._id.toString(),
      name: t.name,
      type: t.type,
      amount: t.amount ? formatDecimalString(t.amount) : null,
      accountId: t.accountId,
      transferToAccountId: t.transferToAccountId,
      categoryId: t.categoryId,
      subcategoryId: t.subcategoryId,
      note: t.note,
      orderIndex: t.orderIndex,
      version: t.version,
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});
