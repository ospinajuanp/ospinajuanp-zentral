import mongoose, { Schema, Document, Types } from 'mongoose';

export type SavingsInvestmentType = 'savings' | 'investment' | 'CDT' | 'pension' | 'crypto' | 'other';
export type SavingsInvestmentStatus = 'active' | 'closed' | 'transferred';
export type InterestFrequency = 'monthly' | 'quarterly' | 'annually' | 'at_maturity' | 'none';

export interface ISavingsInvestment extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  type: SavingsInvestmentType;
  initialAmount: number;
  currentBalance: number;
  interestRate: number;
  interestFrequency: InterestFrequency;
  startDate: Date;
  expectedEndDate?: Date;
  lastInterestCalculation: Date;
  linkedExpenseId?: Types.ObjectId;
  notes?: string;
  status: SavingsInvestmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsInvestmentSchema = new Schema<ISavingsInvestment>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['savings', 'investment', 'CDT', 'pension', 'crypto', 'other'],
      required: true,
    },
    initialAmount: { type: Number, required: true, min: 0 },
    currentBalance: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, default: 0, min: 0 },
    interestFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually', 'at_maturity', 'none'],
      default: 'none',
    },
    startDate: { type: Date, required: true },
    expectedEndDate: { type: Date },
    lastInterestCalculation: { type: Date, default: Date.now },
    linkedExpenseId: { type: Schema.Types.ObjectId, ref: 'PersonalFinanceExpense' },
    notes: { type: String },
    status: {
      type: String,
      enum: ['active', 'closed', 'transferred'],
      default: 'active',
    },
  },
  { timestamps: true }
);

SavingsInvestmentSchema.index({ workspace: 1, user: 1, status: 1 });
SavingsInvestmentSchema.index({ workspace: 1, user: 1, type: 1 });
SavingsInvestmentSchema.index({ linkedExpenseId: 1 });

export const SavingsInvestment =
  mongoose.models.SavingsInvestment ||
  mongoose.model<ISavingsInvestment>('SavingsInvestment', SavingsInvestmentSchema);
