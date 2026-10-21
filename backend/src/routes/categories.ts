import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { Category, Subcategory } from "../models/Category.js";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const categories = await Category.find({ userId, isDeleted: false }).sort({ orderIndex: 1 });
    const subcategories = await Subcategory.find({ userId, isDeleted: false }).sort({ orderIndex: 1 });

    const result = categories.map((c) => ({
      id: c.clientLocalId,
      _id: c._id.toString(),
      type: c.type,
      name: c.name,
      icon: c.icon,
      color: c.color,
      isArchived: c.isArchived,
      orderIndex: c.orderIndex,
      version: c.version,
      subcategories: subcategories
        .filter((s) => s.categoryId === c.clientLocalId)
        .map((s) => ({
          id: s.clientLocalId,
          _id: s._id.toString(),
          categoryId: s.categoryId,
          name: s.name,
          icon: s.icon,
          color: s.color,
          isArchived: s.isArchived,
          orderIndex: s.orderIndex,
          version: s.version,
        })),
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

categoriesRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, name, icon = "ic_category_default", color = "#e91e63", clientLocalId } = req.body;

    if (!type || !name) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Category type and name are required." });
      return;
    }

    let assignedLocalId = clientLocalId;
    if (assignedLocalId === undefined || assignedLocalId === null) {
      const highest = await Category.findOne({ userId }).sort({ clientLocalId: -1 });
      assignedLocalId = (highest?.clientLocalId || 0) + 1;
    }

    const cat = new Category({
      userId,
      clientLocalId: assignedLocalId,
      type,
      name: name.trim(),
      icon,
      color,
      isArchived: false,
      orderIndex: 0,
      version: 1,
      isDeleted: false,
    });

    await cat.save();

    res.status(201).json({
      id: cat.clientLocalId,
      _id: cat._id.toString(),
      type: cat.type,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isArchived: cat.isArchived,
      orderIndex: cat.orderIndex,
      version: cat.version,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

categoriesRouter.post("/:categoryId/subcategories", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(String(req.params.categoryId), 10);
    const { name, icon = "ic_subcategory_default", color = "#e91e63", clientLocalId } = req.body;

    if (!name) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Subcategory name is required." });
      return;
    }

    let assignedLocalId = clientLocalId;
    if (assignedLocalId === undefined || assignedLocalId === null) {
      const highest = await Subcategory.findOne({ userId }).sort({ clientLocalId: -1 });
      assignedLocalId = (highest?.clientLocalId || 0) + 1;
    }

    const sub = new Subcategory({
      userId,
      clientLocalId: assignedLocalId,
      categoryId,
      name: name.trim(),
      icon,
      color,
      isArchived: false,
      orderIndex: 0,
      version: 1,
      isDeleted: false,
    });

    await sub.save();

    res.status(201).json({
      id: sub.clientLocalId,
      _id: sub._id.toString(),
      categoryId: sub.categoryId,
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      isArchived: sub.isArchived,
      orderIndex: sub.orderIndex,
      version: sub.version,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});
