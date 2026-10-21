import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Missing or malformed Authorization header with Bearer token.",
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { id: string; email: string };
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err: any) {
    res.status(401).json({
      error: "INVALID_TOKEN",
      message: "Token has expired or is invalid.",
    });
  }
}
