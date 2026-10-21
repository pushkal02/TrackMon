import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./config.js";
import { connectDB } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { accountsRouter } from "./routes/accounts.js";
import { transactionsRouter } from "./routes/transactions.js";
import { categoriesRouter } from "./routes/categories.js";
import { budgetsRouter } from "./routes/budgets.js";
import { recurringRouter } from "./routes/recurring.js";
import { syncRouter } from "./routes/sync.js";
import { migrationRouter } from "./routes/migration.js";

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "trackmon-backend",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/accounts", accountsRouter);
app.use("/api/v1/transactions", transactionsRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/budgets", budgetsRouter);
app.use("/api/v1/recurring", recurringRouter);
app.use("/api/v1/sync", syncRouter);
app.use("/api/v1/backup", migrationRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Endpoint does not exist." });
});

// Start server function
export async function startServer() {
  await connectDB();
  const server = app.listen(config.port, () => {
    console.log(`[TrackMon] Backend API service running at http://localhost:${config.port}`);
    console.log(`[TrackMon] Health endpoint available at http://localhost:${config.port}/health`);
  });
  return server;
}

// If executed directly
if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
  startServer();
}
