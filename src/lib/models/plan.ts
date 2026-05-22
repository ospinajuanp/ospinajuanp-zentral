import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanModule {
  module: mongoose.Types.ObjectId;
  quotaOverride: number | null;
}

export interface IPlan extends Document {
  name: string;
  price: string;
  monthlyPrice: number | null;
  description: string;
  includedModules: IPlanModule[];
  maxUsers: number;
  extraFeatures: string[];
  cta: string;
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planModuleSchema = new Schema<IPlanModule>(
  {
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    quotaOverride: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

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
    includedModules: {
      type: [planModuleSchema],
      default: [],
    },
    maxUsers: {
      type: Number,
      default: 1,
    },
    extraFeatures: {
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
