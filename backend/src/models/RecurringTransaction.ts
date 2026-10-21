import { Schema, model, Document, Types } from "mongoose";

export interface IRecurringTransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clientLocalId: number;
  transactionType: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: Types.Decimal128;
  accountId: number;
  categoryId?: number | null;
  subcategoryId?: number | null;
  transferToAccountId?: number | null;
  note?: string | null;
  repeatPeriod: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  repeatInterval: number;
  endType: "NEVER" | "DATE" | "COUNT";
  endDate?: string | null;
  endCount?: number | null;
  autoConfirmation: boolean;
  scheduledDate: number;
  finishedCount: number;
  finishedDate?: number | null;
  orderIndex: number;
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTransactionSchema = new Schema<IRecurringTransaction>(
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
    transactionType: {
      type: String,
      enum: ["EXPENSE", "INCOME", "TRANSFER"],
      required: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    accountId: {
      type: Number,
      required: true,
    },
    categoryId: {
      type: Number,
      default: null,
    },
    subcategoryId: {
      type: Number,
      default: null,
    },
    transferToAccountId: {
      type: Number,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
    repeatPeriod: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
      required: true,
    },
    repeatInterval: {
      type: Number,
      default: 1,
    },
    endType: {
      type: String,
      enum: ["NEVER", "DATE", "COUNT"],
      default: "NEVER",
    },
    endDate: {
      type: String,
      default: null,
    },
    endCount: {
      type: Number,
      default: null,
    },
    autoConfirmation: {
      type: Boolean,
      default: false,
    },
    scheduledDate: {
      type: Number,
      required: true,
    },
    finishedCount: {
      type: Number,
      default: 0,
    },
    finishedDate: {
      type: Number,
      default: null,
    },
    orderIndex: {
      type: Number,
      default: 0,
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

RecurringTransactionSchema.index({ userId: 1, clientLocalId: 1 }, { unique: true });

export const RecurringTransaction = model<IRecurringTransaction>(
  "RecurringTransaction",
  RecurringTransactionSchema
);
