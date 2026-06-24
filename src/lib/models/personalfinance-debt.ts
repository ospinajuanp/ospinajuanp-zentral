import mongoose, { Schema, Types } from 'mongoose';

export type DebtType = 'credit_card' | 'personal_loan' | 'vehicle_loan' | 'mortgage' | 'microcredit' | 'family_loan' | 'other';
export type DebtStatus = 'active' | 'paid' | 'restructured';

export interface IPersonalFinanceDebt {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  debtType: DebtType;
  creditor: string;
  originalAmount: number;
  currentBalance: number;
  currency: 'COP' | 'USD';
  interestRate: number;
  monthlyPayment: number;
  startDate: Date;
  expectedEndDate?: Date;
  status: DebtStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceDebtSchema = new Schema<IPersonalFinanceDebt>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    debtType: {
      type: String,
      enum: ['credit_card', 'personal_loan', 'vehicle_loan', 'mortgage', 'microcredit', 'family_loan', 'other'],
      required: true,
    },
    creditor: { type: String, required: true },
    originalAmount: { type: Number, required: true, min: 0 },
    currentBalance: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['COP', 'USD'], required: true },
    interestRate: { type: Number, required: true, min: 0 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    expectedEndDate: { type: Date },
    status: { type: String, enum: ['active', 'paid', 'restructured'], default: 'active' },
    notes: { type: String },
  },
  { timestamps: true }
);

PersonalFinanceDebtSchema.index({ workspace: 1, user: 1, status: 1 });
PersonalFinanceDebtSchema.index({ workspace: 1, user: 1, createdAt: -1 });

export const PersonalFinanceDebt =
  mongoose.models.PersonalFinanceDebt ||
  mongoose.model<IPersonalFinanceDebt>('PersonalFinanceDebt', PersonalFinanceDebtSchema);
