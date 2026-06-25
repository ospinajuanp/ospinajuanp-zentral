import mongoose, { Schema, Model } from 'mongoose';

export interface IBudgetRule extends mongoose.Document {
  workspace: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  name: string;
  percentages: {
    obligatory: number;
    savingsInvestment: number;
    discretionary: number;
  };
  isActive: boolean;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetRuleSchema = new Schema<IBudgetRule>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    percentages: {
      obligatory: { type: Number, required: true, min: 0, max: 100 },
      savingsInvestment: { type: Number, required: true, min: 0, max: 100 },
      discretionary: { type: Number, required: true, min: 0, max: 100 },
    },
    isActive: { type: Boolean, default: false },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BudgetRuleSchema.pre('validate', function () {
  const total =
    (this.percentages?.obligatory || 0) +
    (this.percentages?.savingsInvestment || 0) +
    (this.percentages?.discretionary || 0);

  if (total !== 100) {
    throw new Error(`Los porcentajes deben sumar exactamente 100%. Suma actual: ${total}%`);
  }
});

BudgetRuleSchema.index({ workspace: 1, user: 1, isActive: 1 });
BudgetRuleSchema.index({ workspace: 1, user: 1, isCustom: 1 });

export const BudgetRule: Model<IBudgetRule> =
  mongoose.models.BudgetRule ||
  mongoose.model<IBudgetRule>('BudgetRule', BudgetRuleSchema);
