import { Schema, model, Document, Types } from "mongoose";

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clientLocalId: number;
  name: string;
  details?: string | null;
  type: "REGULAR" | "CREDIT";
  currencyCode: string;
  initialBalance: Types.Decimal128;
  creditLimit: Types.Decimal128;
  icon: string;
  color: string;
  isPrimary: boolean;
  isArchived: boolean;
  includeBalance: boolean;
  orderIndex: number;
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
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
    details: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["REGULAR", "CREDIT"],
      default: "REGULAR",
      required: true,
    },
    currencyCode: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    initialBalance: {
      type: Schema.Types.Decimal128,
      required: true,
      default: Types.Decimal128.fromString("0.00"),
    },
    creditLimit: {
      type: Schema.Types.Decimal128,
      required: true,
      default: Types.Decimal128.fromString("0.00"),
    },
    icon: {
      type: String,
      default: "ic_account_1",
    },
    color: {
      type: String,
      default: "#26a69a",
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    includeBalance: {
      type: Boolean,
      default: true,
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

AccountSchema.index({ userId: 1, clientLocalId: 1 }, { unique: true });
AccountSchema.index({ userId: 1, isArchived: 1, orderIndex: 1 });

export const Account = model<IAccount>("Account", AccountSchema);
