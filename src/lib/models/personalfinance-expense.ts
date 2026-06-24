import mongoose, { Schema, Document, Types } from 'mongoose';

export type ExpenseType = 'obligatory' | 'savings_investment' | 'discretionary';
export type RecurringPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface IPersonalFinanceExpense extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  type: ExpenseType;
  category: string;
  amount: number;
  currency: 'COP' | 'USD';
  isRecurrent: boolean;
  recurringPeriod?: RecurringPeriod;
  description?: string;
  date: Date;
  linkedGoalId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceExpenseSchema = new Schema<IPersonalFinanceExpense>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['obligatory', 'savings_investment', 'discretionary'],
      required: true,
    },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['COP', 'USD'], required: true },
    isRecurrent: { type: Boolean, default: false },
    recurringPeriod: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    description: { type: String },
    date: { type: Date, required: true },
    linkedGoalId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

PersonalFinanceExpenseSchema.index({ workspace: 1, user: 1, createdAt: -1 });
PersonalFinanceExpenseSchema.index({ workspace: 1, user: 1, type: 1 });
PersonalFinanceExpenseSchema.index({ workspace: 1, user: 1, date: -1 });

export const PersonalFinanceExpense =
  mongoose.models.PersonalFinanceExpense ||
  mongoose.model<IPersonalFinanceExpense>('PersonalFinanceExpense', PersonalFinanceExpenseSchema);
