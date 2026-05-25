import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspacePurchase extends Document {
  workspace: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  planName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: string;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workspacePurchaseSchema = new Schema<IWorkspacePurchase>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'COP',
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'cancelled'],
      default: 'completed',
    },
    paymentMethod: {
      type: String,
      default: 'simulated',
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

workspacePurchaseSchema.index({ workspace: 1, createdAt: -1 });

export const WorkspacePurchase =
  mongoose.models.WorkspacePurchase ??
  mongoose.model<IWorkspacePurchase>('WorkspacePurchase', workspacePurchaseSchema);
