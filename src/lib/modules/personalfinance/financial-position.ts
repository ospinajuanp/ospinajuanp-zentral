import dbConnect from '@/lib/db/mongoose';
import mongoose, { Types } from 'mongoose';
import { PersonalFinanceIncome } from '@/lib/models/personalfinance-income';
import { PersonalFinanceExpense } from '@/lib/models/personalfinance-expense';
import { PersonalFinanceDebt } from '@/lib/models/personalfinance-debt';
import { DebtPayment } from '@/lib/models/debt-payment';
import { EmergencyFund } from '@/lib/models/emergency-fund';
import { SavingsInvestment } from '@/lib/models/savings-investment';
import { FinancialPosition } from '@/lib/models/financial-position';

export interface FinancialPositionData {
  totalIncome: number;
  totalExpenses: number;
  totalSavingsInvested: number;
  emergencyFundBalance: number;
  totalDebtBalance: number;
  totalDebtPaid: number;
  availableMoney: number;
  snapshots: Array<{
    month: number;
    year: number;
    totalIncome: number;
    totalExpenses: number;
    totalSavingsInvested: number;
    emergencyFundBalance: number;
    totalDebtBalance: number;
    availableMoney: number;
  }>;
}

export async function recalculateFinancialPosition(
  workspaceId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<FinancialPositionData> {
  const workspaceObjectId = typeof workspaceId === 'string' ? new mongoose.Types.ObjectId(workspaceId) : workspaceId;
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  await dbConnect();

  const [totalIncomeResult, totalExpensesResult, debtsResult, debtPaidResult, emergencyFundResult, savingsResult] =
    await Promise.all([
      PersonalFinanceIncome.aggregate([
        { $match: { workspace: workspaceObjectId, user: userObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PersonalFinanceExpense.aggregate([
        { $match: { workspace: workspaceObjectId, user: userObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PersonalFinanceDebt.aggregate([
        { $match: { workspace: workspaceObjectId, user: userObjectId, status: 'active' } },
        { $group: { _id: null, totalBalance: { $sum: '$currentBalance' } } },
      ]),
      DebtPayment.aggregate([
        { $match: { workspace: workspaceObjectId, user: userObjectId } },
        { $group: { _id: null, totalPrincipal: { $sum: '$principalPortion' } } },
      ]),
      EmergencyFund.findOne({ workspace: workspaceObjectId, user: userObjectId }).lean(),
      SavingsInvestment.aggregate([
        { $match: { workspace: workspaceObjectId, user: userObjectId, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$currentBalance' } } },
      ]),
    ]);

  const totalIncome = totalIncomeResult[0]?.total || 0;
  const totalExpenses = totalExpensesResult[0]?.total || 0;
  const totalDebtBalance = debtsResult[0]?.totalBalance || 0;
  const totalDebtPaid = debtPaidResult[0]?.totalPrincipal || 0;
  const emergencyFundBalance = emergencyFundResult?.savedAmount || 0;
  const totalSavingsInvested = savingsResult[0]?.total || 0;

  const availableMoney =
    totalIncome - totalExpenses - totalDebtBalance + emergencyFundBalance + totalSavingsInvested;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const monthlyIncomeResult = await PersonalFinanceIncome.aggregate([
    {
      $match: {
        workspace: workspaceObjectId,
        user: userObjectId,
        date: {
          $gte: new Date(currentYear, currentMonth - 1, 1),
          $lt: new Date(currentYear, currentMonth, 1),
        },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const monthlyExpensesResult = await PersonalFinanceExpense.aggregate([
    {
      $match: {
        workspace: workspaceObjectId,
        user: userObjectId,
        date: {
          $gte: new Date(currentYear, currentMonth - 1, 1),
          $lt: new Date(currentYear, currentMonth, 1),
        },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const monthlyIncome = monthlyIncomeResult[0]?.total || 0;
  const monthlyExpenses = monthlyExpensesResult[0]?.total || 0;
  const monthlySavingsInvested = totalSavingsInvested;
  const monthlyDebtBalance = totalDebtBalance;
  const monthlyAvailable =
    monthlyIncome - monthlyExpenses - monthlyDebtBalance + emergencyFundBalance + monthlySavingsInvested;

  const newSnapshot = {
    month: currentMonth,
    year: currentYear,
    totalIncome: monthlyIncome,
    totalExpenses: monthlyExpenses,
    totalSavingsInvested: monthlySavingsInvested,
    emergencyFundBalance,
    totalDebtBalance: monthlyDebtBalance,
    availableMoney: monthlyAvailable,
  };

  const financialPosition = await FinancialPosition.findOneAndUpdate(
    { workspace: workspaceObjectId, user: userObjectId },
    {
      $set: {
        totalIncome,
        totalExpenses,
        totalSavingsInvested,
        emergencyFundBalance,
        totalDebtBalance,
        totalDebtPaid,
        lastUpdated: new Date(),
        snapshots: newSnapshot,
      },
    },
    { upsert: true, new: true, lean: true }
  );

  return {
    totalIncome,
    totalExpenses,
    totalSavingsInvested,
    emergencyFundBalance,
    totalDebtBalance,
    totalDebtPaid,
    availableMoney,
    snapshots: (financialPosition as any).snapshots || [newSnapshot],
  };
}

export async function getFinancialPosition(
  workspaceId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<FinancialPositionData | null> {
  const workspaceObjectId = typeof workspaceId === 'string' ? new mongoose.Types.ObjectId(workspaceId) : workspaceId;
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  await dbConnect();

  const position = await FinancialPosition.findOne({ workspace: workspaceObjectId, user: userObjectId }).lean();

  if (!position) {
    return recalculateFinancialPosition(workspaceObjectId, userObjectId);
  }

  const availableMoney =
    position.totalIncome -
    position.totalExpenses -
    position.totalDebtBalance +
    position.emergencyFundBalance +
    position.totalSavingsInvested;

  return {
    totalIncome: position.totalIncome,
    totalExpenses: position.totalExpenses,
    totalSavingsInvested: position.totalSavingsInvested,
    emergencyFundBalance: position.emergencyFundBalance,
    totalDebtBalance: position.totalDebtBalance,
    totalDebtPaid: position.totalDebtPaid,
    availableMoney,
    snapshots: position.snapshots || [],
  };
}
