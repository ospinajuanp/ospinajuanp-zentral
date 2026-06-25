import mongoose, { Schema, Model } from 'mongoose';

export type BudgetCategoryType = 'obligatory' | 'savings_investment' | 'discretionary' | 'custom';

export interface IBudgetCategory {
  name: string;
  percentage: number;
  expenseType?: BudgetCategoryType;
}

export interface IBudgetRule extends mongoose.Document {
  workspace: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  name: string;
  percentages: IBudgetCategory[];
  totalPercentage: number;
  isActive: boolean;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetCategorySchema = new Schema<IBudgetCategory>(
  {
    name: { type: String, required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    expenseType: {
      type: String,
      enum: ['obligatory', 'savings_investment', 'discretionary', 'custom', undefined],
    },
  },
  { _id: false }
);

const BudgetRuleSchema = new Schema<IBudgetRule>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    percentages: { type: [BudgetCategorySchema], default: [] },
    totalPercentage: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BudgetRuleSchema.pre('validate', function () {
  this.totalPercentage = this.percentages.reduce((sum, p) => sum + (p.percentage || 0), 0);
});

BudgetRuleSchema.index({ workspace: 1, user: 1, isActive: 1 });
BudgetRuleSchema.index({ workspace: 1, user: 1, isCustom: 1 });

export const BudgetRule: Model<IBudgetRule> =
  mongoose.models.BudgetRule ||
  mongoose.model<IBudgetRule>('BudgetRule', BudgetRuleSchema);
