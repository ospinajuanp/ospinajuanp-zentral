import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMonthlySnapshot {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavingsInvested: number;
  emergencyFundBalance: number;
  totalDebtBalance: number;
  availableMoney: number;
}

export interface IFinancialPosition extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  
  totalIncome: number;
  totalExpenses: number;
  totalSavingsInvested: number;
  emergencyFundBalance: number;
  totalDebtBalance: number;
  totalDebtPaid: number;
  
  snapshots: IMonthlySnapshot[];
  
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlySnapshotSchema = new Schema<IMonthlySnapshot>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    totalIncome: { type: Number, default: 0, min: 0 },
    totalExpenses: { type: Number, default: 0, min: 0 },
    totalSavingsInvested: { type: Number, default: 0, min: 0 },
    emergencyFundBalance: { type: Number, default: 0, min: 0 },
    totalDebtBalance: { type: Number, default: 0, min: 0 },
    availableMoney: { type: Number, default: 0 },
  },
  { _id: false }
);

const FinancialPositionSchema = new Schema<IFinancialPosition>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    totalIncome: { type: Number, default: 0, min: 0 },
    totalExpenses: { type: Number, default: 0, min: 0 },
    totalSavingsInvested: { type: Number, default: 0, min: 0 },
    emergencyFundBalance: { type: Number, default: 0, min: 0 },
    totalDebtBalance: { type: Number, default: 0, min: 0 },
    totalDebtPaid: { type: Number, default: 0, min: 0 },
    
    snapshots: { type: [MonthlySnapshotSchema], default: [] },
    
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

FinancialPositionSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const FinancialPosition =
  mongoose.models.FinancialPosition ||
  mongoose.model<IFinancialPosition>('FinancialPosition', FinancialPositionSchema);
