import mongoose, { Schema, Document } from 'mongoose';

export interface IModule extends Document {
  key: string;
  name: string;
  description: string;
  tier: 'free' | 'premium';
  status: 'active' | 'inactive' | 'coming_soon';
  defaultQuota: number;
  visible: boolean;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    tier: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'coming_soon'],
      default: 'active',
    },
    defaultQuota: {
      type: Number,
      default: 100,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const Module =
  mongoose.models.Module ?? mongoose.model<IModule>('Module', moduleSchema);
