import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDebtPayment extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  debtId: Types.ObjectId;
  linkedExpenseId?: Types.ObjectId;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  balanceAfter: number;
  paymentDate: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DebtPaymentSchema = new Schema<IDebtPayment>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    debtId: { type: Schema.Types.ObjectId, ref: 'PersonalFinanceDebt', required: true },
    linkedExpenseId: { type: Schema.Types.ObjectId, ref: 'PersonalFinanceExpense' },
    amount: { type: Number, required: true, min: 0 },
    principalPortion: { type: Number, default: 0, min: 0 },
    interestPortion: { type: Number, default: 0, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

DebtPaymentSchema.index({ workspace: 1, user: 1, debtId: 1, paymentDate: -1 });
DebtPaymentSchema.index({ linkedExpenseId: 1 });

export const DebtPayment =
  mongoose.models.DebtPayment ||
  mongoose.model<IDebtPayment>('DebtPayment', DebtPaymentSchema);
