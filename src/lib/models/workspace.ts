import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  slug: string;
  owner?: mongoose.Types.ObjectId | null;
  isActive: boolean;
  isPayReady: boolean;
  plan?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPayReady: {
      type: Boolean,
      default: false,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },
  },
  { timestamps: true }
);

export const Workspace =
  mongoose.models.Workspace ?? mongoose.model<IWorkspace>('Workspace', workspaceSchema);
