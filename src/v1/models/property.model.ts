import { Schema, model, Types } from "mongoose";
import { BaseModel } from "../interfaces/general.interface";

interface IProperty extends BaseModel {
  images: string[];
  title: string;
  location: string;
  price: string;
  rating: number;
  reviewCount: number;
  beds: number;
  rooms: number;
  bathrooms: number;
  amenities: string[];
  address: string;
  host: {
    name: string;
    yearsHosting: number;
    rating: number;
    reviewCount: number;
    image: string;
  };
  highlights: {
    title: string;
    desc: string;
  }[];
  description: string;
  gallery: {
    src: string;
    label: string;
    desc: string;
  }[];
  latitude: number;
  longitude: number;
}

const propertySchema = new Schema(
  {
    images: [{ type: String, required: true }],
    title: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviewCount: { type: Number, required: true, min: 0 },
    beds: { type: Number, required: true, min: 0 },
    rooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    amenities: { type: [String], required: true },
    address: { type: String, required: true },
    host: {
      name: { type: String, required: true },
      yearsHosting: { type: Number, required: true, min: 0 },
      rating: { type: Number, required: true, min: 0, max: 5 },
      reviewCount: { type: Number, required: true, min: 0 },
      image: { type: String, required: true },
    },
    highlights: [
      {
        title: { type: String, required: true },
        desc: { type: String, required: true },
      },
    ],
    description: { type: String, required: true },
    gallery: [
      {
        src: { type: String, required: true },
        label: { type: String, required: true },
        desc: { type: String, required: true },
      },
    ],
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const Property = model<IProperty>("Property", propertySchema);

export { IProperty, Property };
