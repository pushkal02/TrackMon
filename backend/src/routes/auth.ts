import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { config } from "../config.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res): Promise<void> => {
  try {
    const { email, password, currencyCode } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Email and password are required." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Password must be at least 6 characters." });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: "USER_EXISTS", message: "A user with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      currencyCode: (currencyCode || config.defaultBaseCurrency).toUpperCase(),
    });

    await user.save();

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as any);

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        currencyCode: user.currencyCode,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

authRouter.post("/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "Email and password are required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password." });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password." });
      return;
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as any);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        currencyCode: user.currencyCode,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: "NOT_FOUND", message: "User not found." });
      return;
    }

    res.json({
      id: user._id.toString(),
      email: user.email,
      currencyCode: user.currencyCode,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});
