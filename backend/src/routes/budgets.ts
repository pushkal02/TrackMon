import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { Budget } from "../models/Budget.js";
import { toDecimal128, formatDecimalString } from "../utils/decimal.js";

export const budgetsRouter = Router();

budgetsRouter.use(requireAuth);

budgetsRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const budgets = await Budget.find({ userId, isDeleted: false }).sort({ orderIndex: 1 });

    const result = budgets.map((b) => ({
      id: b.clientLocalId,
      _id: b._id.toString(),
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
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

budgetsRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      icon = "ic_budget_default",
      color = "#2196f3",
      amount,
      accountFilters = [],
      categoryFilters = [],
      specificCategoryFilters = [],
      startDate,
      period = "MONTHLY",
      repeatInterval = 1,
      endDate = null,
      clientLocalId,
    } = req.body;

    if (!name || !amount || !startDate) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "name, amount, and startDate are required." });
      return;
    }

    let assignedLocalId = clientLocalId;
    if (assignedLocalId === undefined || assignedLocalId === null) {
      const highest = await Budget.findOne({ userId }).sort({ clientLocalId: -1 });
      assignedLocalId = (highest?.clientLocalId || 0) + 1;
    }

    const budget = new Budget({
      userId,
      clientLocalId: assignedLocalId,
      name: name.trim(),
      icon,
      color,
      amount: toDecimal128(amount),
      accountFilters,
      categoryFilters,
      specificCategoryFilters,
      startDate,
      period,
      repeatInterval,
      endDate,
      orderIndex: 0,
      version: 1,
      isDeleted: false,
    });

    await budget.save();

    res.status(201).json({
      id: budget.clientLocalId,
      _id: budget._id.toString(),
      name: budget.name,
      icon: budget.icon,
      color: budget.color,
      amount: formatDecimalString(budget.amount),
      accountFilters: budget.accountFilters,
      categoryFilters: budget.categoryFilters,
      specificCategoryFilters: budget.specificCategoryFilters,
      startDate: budget.startDate,
      period: budget.period,
      repeatInterval: budget.repeatInterval,
      endDate: budget.endDate,
      orderIndex: budget.orderIndex,
      version: budget.version,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});
