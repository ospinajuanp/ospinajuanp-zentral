import mongoose, { Schema, Document } from 'mongoose';
import type { ModuleTier, ModuleStatus, BillingPeriod } from '@/types';

export interface IModuleSubscription extends Document {
  workspace: mongoose.Types.ObjectId;
  moduleKey: string;
  tier: ModuleTier;
  status: ModuleStatus;
  activatedAt?: Date;
  expiresAt?: Date | null;
  price?: number | null;
  currency: string;
  billingPeriod?: BillingPeriod | null;
  paymentProvider?: string | null;
  paymentProviderId?: string | null;
  monthlyQuota: number;
  usedQuota: number;
  quotaResetAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSubscriptionSchema = new Schema<IModuleSubscription>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    moduleKey: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    activatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    price: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly', 'one_time'],
      default: null,
    },
    paymentProvider: {
      type: String,
      default: null,
    },
    paymentProviderId: {
      type: String,
      default: null,
    },
    monthlyQuota: {
      type: Number,
      default: 100,
    },
    usedQuota: {
      type: Number,
      default: 0,
    },
    quotaResetAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

moduleSubscriptionSchema.index({ workspace: 1, moduleKey: 1 }, { unique: true });

export const ModuleSubscription =
  mongoose.models.ModuleSubscription ??
  mongoose.model<IModuleSubscription>('ModuleSubscription', moduleSubscriptionSchema);
