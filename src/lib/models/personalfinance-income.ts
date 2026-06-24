import mongoose, { Schema, Document, Types } from 'mongoose';

export type IncomeType = 'recurrent' | 'occasional';

export interface IPersonalFinanceIncome extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  type: IncomeType;
  category: string;
  amount: number;
  currency: 'COP' | 'USD';
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceIncomeSchema = new Schema<IPersonalFinanceIncome>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['recurrent', 'occasional'], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['COP', 'USD'], required: true },
    description: { type: String },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

PersonalFinanceIncomeSchema.index({ workspace: 1, user: 1, createdAt: -1 });
PersonalFinanceIncomeSchema.index({ workspace: 1, user: 1, type: 1 });
PersonalFinanceIncomeSchema.index({ workspace: 1, user: 1, date: -1 });

export const PersonalFinanceIncome =
  mongoose.models.PersonalFinanceIncome ||
  mongoose.model<IPersonalFinanceIncome>('PersonalFinanceIncome', PersonalFinanceIncomeSchema);
