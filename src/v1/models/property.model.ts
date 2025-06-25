import { Schema, model, Types } from "mongoose";
import { BaseModel } from "../interfaces/general.interface";
import {
  PropertyTypes,
  allPropertySubTypes,
} from "../enums/propertyTypes.enum";
import { Utilities, Category } from "../enums/propertyTypes.enum";

interface IProperty extends BaseModel {
  landlord: Types.ObjectId;
  title: string;
  type: string;
  subType: string;
  address: string;
  latitude: number;
  longitude: number;
  utilities: Utilities[];
  categories: Category[];
  yearBuilt: number;
  parking: boolean;
  furnished: boolean;
  shortTermRental: boolean;
  leaseTerms: "daily" | "monthly" | "negotiable";
  petFriendly: boolean;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  unitSize: string;
  photos: string[];
  description: string;
  leadContact: {
    name: string;
    email: string;
    phone: string;
  };
  isApproved: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
}

const propertySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(PropertyTypes),
      required: true,
    },
    subType: {
      type: String,
      enum: allPropertySubTypes,
      required: true,
    },
    address: {
      type: String,
      required: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    utilities: {
      type: [String],
      enum: Object.values(Utilities),
    },
    categories: {
      type: [String],
      enum: Object.values(Category),
    },
    yearBuilt: {
      type: Number,
      required: true,
    },
    parking: {
      type: Boolean,
      required: true,
    },
    furnished: {
      type: Boolean,
      required: true,
    },
    shortTermRental: {
      type: Boolean,
      required: true,
    },
    leaseTerms: {
      type: String,
      enum: ["monthly", "negotiable"],
      required: true,
    },
    petFriendly: {
      type: Boolean,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    rent: {
      type: Number,
      required: true,
      index: true,
    },
    unitSize: {
      type: String,
      required: true,
    },
    photos: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    leadContact: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Property = model<IProperty>("Property", propertySchema);

export { IProperty, Property };
