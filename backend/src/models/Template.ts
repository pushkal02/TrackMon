import { Schema, model, Document, Types } from "mongoose";

export interface ITemplate extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clientLocalId: number;
  name?: string | null;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount?: Types.Decimal128 | null;
  accountId?: number | null;
  transferToAccountId?: number | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  note?: string | null;
  orderIndex: number;
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
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
      default: null,
    },
    type: {
      type: String,
      enum: ["EXPENSE", "INCOME", "TRANSFER"],
      required: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      default: null,
    },
    accountId: {
      type: Number,
      default: null,
    },
    transferToAccountId: {
      type: Number,
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
    note: {
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

TemplateSchema.index({ userId: 1, clientLocalId: 1 }, { unique: true });

export const Template = model<ITemplate>("Template", TemplateSchema);
