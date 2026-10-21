import { Schema, model, Document, Types } from "mongoose";

export interface IBudget extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clientLocalId: number;
  name: string;
  icon: string;
  color: string;
  amount: Types.Decimal128;
  accountFilters: number[];
  categoryFilters: number[];
  specificCategoryFilters: any[];
  startDate: string;
  period: "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  repeatInterval: number;
  endDate?: string | null;
  orderIndex: number;
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "ic_budget_default",
    },
    color: {
      type: String,
      default: "#2196f3",
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    accountFilters: {
      type: [Number],
      default: [],
    },
    categoryFilters: {
      type: [Number],
      default: [],
    },
    specificCategoryFilters: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    startDate: {
      type: String,
      required: true,
    },
    period: {
      type: String,
      enum: ["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"],
      default: "MONTHLY",
    },
    repeatInterval: {
      type: Number,
      default: 1,
    },
    endDate: {
      type: String,
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

BudgetSchema.index({ userId: 1, clientLocalId: 1 }, { unique: true });
BudgetSchema.index({ userId: 1, orderIndex: 1 });

export const Budget = model<IBudget>("Budget", BudgetSchema);
