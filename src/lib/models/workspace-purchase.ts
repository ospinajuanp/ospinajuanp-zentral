import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchasedModule {
  moduleKey: string;
  quota: number;
  tier: string;
  autoRenew?: boolean;
}

export interface IWorkspacePurchase extends Document {
  workspace: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId | null;
  planName: string;
  amount: number;
  currency: string;
  status: 'active' | 'expired' | 'cancelled';
  paymentMethod: string;
  modules: IPurchasedModule[];
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const purchasedModuleSchema = new Schema<IPurchasedModule>(
  {
    moduleKey: { type: String, required: true },
    quota: { type: Number, required: true },
    tier: { type: String, required: true },
  },
  { _id: false }
);

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
      default: null,
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
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    paymentMethod: {
      type: String,
      default: 'simulated',
    },
    modules: {
      type: [purchasedModuleSchema],
      default: [],
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

workspacePurchaseSchema.index({ workspace: 1, createdAt: -1 });
workspacePurchaseSchema.index({ workspace: 1, status: 1 });

export const WorkspacePurchase =
  mongoose.models.WorkspacePurchase ??
  mongoose.model<IWorkspacePurchase>('WorkspacePurchase', workspacePurchaseSchema);
