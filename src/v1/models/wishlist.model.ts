import { Schema, model, Types } from "mongoose";
import { BaseModel } from "../interfaces/general.interface";

interface IWishlistItem extends BaseModel {
  user: Types.ObjectId;
  property: Types.ObjectId;
}

const WishlistItemSchema: Schema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const WishlistItem = model<IWishlistItem>(
  "WishlistItem",
  WishlistItemSchema
);

export { IWishlistItem, WishlistItem };
