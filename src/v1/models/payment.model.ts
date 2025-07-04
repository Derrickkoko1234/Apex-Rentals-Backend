import { Schema, model, Types } from "mongoose";
import { BaseModel } from "../interfaces/general.interface";
import { PaymentStatus } from "./booking.model";

interface IPayment extends BaseModel {
  user: Types.ObjectId;
  booking: Types.ObjectId;
  amount: number;
  reference: string;
  status: PaymentStatus;
  gateway: string;
  channel?: string;
  paidAt?: Date;
}

const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    gateway: {
      type: String,
      required: true,
      default: "paystack",
    },
    channel: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = model<IPayment>("Payment", paymentSchema);

export { IPayment, Payment };