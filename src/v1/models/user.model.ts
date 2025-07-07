import { Schema, model, Types } from "mongoose";
import { RoleEnum } from "../enums/role.enum";
import { BaseModel } from "../interfaces/general.interface";

interface IUser extends BaseModel {
  role: RoleEnum;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar?: string | null;
  address?: string | null;
  gender?: string | null;
  phone: string;
  isVerified: boolean;
}

const UserSchema: Schema = new Schema(
  {
    role: {
      type: String,
      enum: [RoleEnum.USER, RoleEnum.LANDLORD, RoleEnum.ADMIN],
      default: RoleEnum.USER,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      default: null,
    },
    phone: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Transform the output to remove the __v and password fields
UserSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

UserSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

const User = model<IUser>("User", UserSchema);

export { IUser, User };
