import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clientLocalId: number;
  type: "EXPENSE" | "INCOME";
  name: string;
  icon: string;
  color: string;
  isArchived: boolean;
  orderIndex: number;
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
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
    type: {
      type: String,
      enum: ["EXPENSE", "INCOME"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "ic_category_default",
    },
    color: {
      type: String,
      default: "#e91e63",
    },
    isArchived: {
      type: Boolean,
      default: false,
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

CategorySchema.index({ userId: 1, clientLocalId: 1 }, { unique: true });
CategorySchema.index({ userId: 1, type: 1, orderIndex: 1 });

export const Category = model<ICategory>("Category", CategorySchema);

export interface ISubcategory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clientLocalId: number;
  categoryId: number;
  name: string;
  icon: string;
  color: string;
  isArchived: boolean;
  orderIndex: number;
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema = new Schema<ISubcategory>(
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
    categoryId: {
      type: Number,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "ic_subcategory_default",
    },
    color: {
      type: String,
      default: "#e91e63",
    },
    isArchived: {
      type: Boolean,
      default: false,
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

SubcategorySchema.index({ userId: 1, clientLocalId: 1 }, { unique: true });
SubcategorySchema.index({ userId: 1, categoryId: 1, orderIndex: 1 });

export const Subcategory = model<ISubcategory>("Subcategory", SubcategorySchema);
