import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/trackmon",
  jwtSecret: process.env.JWT_SECRET || "trackmon_dev_secret_key_change_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
  defaultBaseCurrency: process.env.DEFAULT_BASE_CURRENCY || "USD",
  nodeEnv: process.env.NODE_ENV || "development",
};
