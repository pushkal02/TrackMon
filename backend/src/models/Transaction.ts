import { Schema, model, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clientLocalId: number;
  timestamp: Date;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  mainCurrencyAmount: Types.Decimal128;
  accountId?: number | null;
  accountAmount?: Types.Decimal128 | null;
  toAccountId?: number | null;
  toAccountAmount?: Types.Decimal128 | null;
  note?: string | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  recurringTransactionId?: number | null;
  isScheduled: boolean;
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientLocalId: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE", "TRANSFER"],
      required: true,
    },
    mainCurrencyAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    accountId: {
      type: Number,
      default: null,
    },
    accountAmount: {
      type: Schema.Types.Decimal128,
      default: null,
    },
    toAccountId: {
      type: Number,
      default: null,
    },
    toAccountAmount: {
      type: Schema.Types.Decimal128,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
    categoryId: {
      type: Number,
      default: null,
    },
    subcategoryId: {
      type: Number,
      default: null,
    },
    recurringTransactionId: {
      type: Number,
      default: null,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ userId: 1, clientLocalId: 1 }, { unique: true });
TransactionSchema.index({ userId: 1, timestamp: -1 });
TransactionSchema.index({ userId: 1, accountId: 1, type: 1 });
TransactionSchema.index({ userId: 1, toAccountId: 1, type: 1 });

export const Transaction = model<ITransaction>("Transaction", TransactionSchema);
