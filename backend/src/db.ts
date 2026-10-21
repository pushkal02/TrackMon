import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDB(): Promise<typeof mongoose | null> {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`[DB] Successfully connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    console.warn(`[DB] Warning: Could not connect to MongoDB at ${config.mongodbUri} (${error.message}).`);
    console.warn("[DB] Server will run in standalone API mode until a valid MongoDB URI is provided.");
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
