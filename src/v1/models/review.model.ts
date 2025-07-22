import { Schema, model, Types } from "mongoose";
import { BaseModel } from "../interfaces/general.interface";

interface IReview extends BaseModel {
  property: Types.ObjectId;
  user: Types.ObjectId;
  booking: Types.ObjectId;
  rating: number;
  comment: string;
}

const reviewSchema = new Schema<IReview>(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ property: 1, user: 1, booking: 1 }, { unique: true });

const Review = model<IReview>("Review", reviewSchema);

export { IReview, Review };
