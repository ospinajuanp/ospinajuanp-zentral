import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPersonalFinanceSummary extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  currency: 'COP' | 'USD';
  billingCycleDay: number;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceSummarySchema = new Schema<IPersonalFinanceSummary>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currency: { type: String, enum: ['COP', 'USD'], default: 'COP' },
    billingCycleDay: { type: Number, min: 1, max: 28, default: 1 },
  },
  { timestamps: true }
);

PersonalFinanceSummarySchema.index({ workspace: 1, user: 1 }, { unique: true });

export const PersonalFinanceSummary =
  mongoose.models.PersonalFinanceSummary ||
  mongoose.model<IPersonalFinanceSummary>('PersonalFinanceSummary', PersonalFinanceSummarySchema);
