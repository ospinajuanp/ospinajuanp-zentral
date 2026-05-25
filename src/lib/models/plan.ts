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
  support: string;
  onboarding: string;
  cta: string;
  ctaLink: string;
  highlighted: boolean;
  isEnterprise: boolean;
  whatsappNumber: string;
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
      default: '',
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
      default: 0,
    },
    extraFeatures: {
      type: [String],
      default: [],
    },
    support: {
      type: String,
      default: 'ninguno',
    },
    onboarding: {
      type: String,
      default: 'ninguno',
    },
    cta: {
      type: String,
      default: 'Empezar',
    },
    ctaLink: {
      type: String,
      default: '/register',
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
    isEnterprise: {
      type: Boolean,
      default: false,
    },
    whatsappNumber: {
      type: String,
      default: '',
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
