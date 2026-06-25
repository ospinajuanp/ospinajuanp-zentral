import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmergencyFund extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  linkedExpenseId: Types.ObjectId;
  savedAmount: number;
  monthsCompleted: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyFundSchema = new Schema<IEmergencyFund>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    linkedExpenseId: { type: Schema.Types.ObjectId, ref: 'PersonalFinanceExpense', required: true },
    savedAmount: { type: Number, default: 0, min: 0 },
    monthsCompleted: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EmergencyFundSchema.index({ workspace: 1, user: 1 }, { unique: true });
EmergencyFundSchema.index({ linkedExpenseId: 1 });

export const EmergencyFund =
  mongoose.models.EmergencyFund ||
  mongoose.model<IEmergencyFund>('EmergencyFund', EmergencyFundSchema);
