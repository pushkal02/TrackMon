import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  currencyCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    currencyCode: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>("User", UserSchema);
