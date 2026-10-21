import { Schema, model, Document, Types } from "mongoose";

export interface IExchangeRate extends Document {
  _id: Types.ObjectId;
  date: string; // ISO date YYYY-MM-DD
  baseCurrencyCode: string;
  rates: Record<string, string>; // JSON map currencyCode -> rate string
  updatedAt: Date;
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    baseCurrencyCode: {
      type: String,
      required: true,
      uppercase: true,
      default: "USD",
    },
    rates: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const ExchangeRate = model<IExchangeRate>("ExchangeRate", ExchangeRateSchema);
