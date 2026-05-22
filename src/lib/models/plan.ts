import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  price: string;
  monthlyPrice: number | null;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: String,
      required: true,
    },
    monthlyPrice: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    cta: {
      type: String,
      default: 'Empezar',
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Plan =
  mongoose.models.Plan ?? mongoose.model<IPlan>('Plan', planSchema);
