export interface BudgetAnalysisCategory {
  theoreticalPercentage: number;
  actualPercentage: number;
  actualAmount: number;
  difference: number;
  status: 'ok' | 'warning' | 'over';
}

export interface BudgetAnalysisResult {
  isCompliant: boolean;
  obligatory: BudgetAnalysisCategory;
  savingsInvestment: BudgetAnalysisCategory;
  discretionary: BudgetAnalysisCategory;
  totalIncome: number;
  totalSpent: number;
  overview: {
    percentage: number;
    status: 'ok' | 'warning' | 'over';
  };
}

export interface BudgetRulePercentages {
  obligatory: number;
  savingsInvestment: number;
  discretionary: number;
}

export interface ActualSpend {
  obligatory: number;
  savingsInvestment: number;
  discretionary: number;
}

export function analyzeBudgetRule(
  actualSpend: ActualSpend,
  percentages: BudgetRulePercentages,
  totalIncome: number
): BudgetAnalysisResult {
  if (totalIncome <= 0) {
    return {
      isCompliant: false,
      obligatory: {
        theoreticalPercentage: percentages.obligatory,
        actualPercentage: 0,
        actualAmount: 0,
        difference: 0,
        status: 'ok',
      },
      savingsInvestment: {
        theoreticalPercentage: percentages.savingsInvestment,
        actualPercentage: 0,
        actualAmount: 0,
        difference: 0,
        status: 'ok',
      },
      discretionary: {
        theoreticalPercentage: percentages.discretionary,
        actualPercentage: 0,
        actualAmount: 0,
        difference: 0,
        status: 'ok',
      },
      totalIncome: 0,
      totalSpent: 0,
      overview: {
        percentage: 0,
        status: 'ok',
      },
    };
  }

  const totalSpent = actualSpend.obligatory + actualSpend.savingsInvestment + actualSpend.discretionary;
  const overallPercentage = (totalSpent / totalIncome) * 100;

  const analyzeCategory = (
    actual: number,
    theoretical: number
  ): BudgetAnalysisCategory => {
    const actualPercentage = (actual / totalIncome) * 100;
    const difference = actual - (totalIncome * (theoretical / 100));

    const diffPercent = Math.abs(actualPercentage - theoretical);
    let status: 'ok' | 'warning' | 'over' = 'ok';
    if (diffPercent > 10) status = 'over';
    else if (diffPercent > 5) status = 'warning';

    return {
      theoreticalPercentage: theoretical,
      actualPercentage,
      actualAmount: actual,
      difference,
      status,
    };
  };

  const obligatory = analyzeCategory(actualSpend.obligatory, percentages.obligatory);
  const savingsInvestment = analyzeCategory(actualSpend.savingsInvestment, percentages.savingsInvestment);
  const discretionary = analyzeCategory(actualSpend.discretionary, percentages.discretionary);

  const allOk =
    obligatory.status === 'ok' &&
    savingsInvestment.status === 'ok' &&
    discretionary.status === 'ok';

  let overallStatus: 'ok' | 'warning' | 'over' = 'ok';
  if (obligatory.status === 'over' || savingsInvestment.status === 'over' || discretionary.status === 'over') {
    overallStatus = 'over';
  } else if (obligatory.status === 'warning' || savingsInvestment.status === 'warning' || discretionary.status === 'warning') {
    overallStatus = 'warning';
  }

  return {
    isCompliant: allOk,
    obligatory,
    savingsInvestment,
    discretionary,
    totalIncome,
    totalSpent,
    overview: {
      percentage: overallPercentage,
      status: overallStatus,
    },
  };
}

export function formatCurrency(amount: number, currency: 'COP' | 'USD' = 'COP'): string {
  const formatter = new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

export function calculateGoalProgress(currentAmount: number, targetAmount: number): {
  percentage: number;
  remaining: number;
  isCompleted: boolean;
} {
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const remaining = Math.max(targetAmount - currentAmount, 0);
  return {
    percentage,
    remaining,
    isCompleted: currentAmount >= targetAmount,
  };
}

export function calculateSuggestedContribution(
  targetAmount: number,
  currentAmount: number,
  targetDate: Date
): number {
  const now = new Date();
  const monthsRemaining = Math.max(
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth()),
    1
  );

  const remaining = targetAmount - currentAmount;
  return remaining / monthsRemaining;
}

export interface HousingAffordabilityResult {
  isAffordable: boolean;
  rentToIncomeRatio: number;
  maxAffordableRent: number;
  recommendation: string;
  severity: 'ok' | 'warning' | 'danger';
}

export function calculateHousingAffordability(
  grossMonthlyIncome: number,
  proposedMonthlyRent: number
): HousingAffordabilityResult {
  if (grossMonthlyIncome <= 0) {
    return {
      isAffordable: false,
      rentToIncomeRatio: 0,
      maxAffordableRent: 0,
      recommendation: 'El ingreso mensual debe ser mayor a 0.',
      severity: 'danger',
    };
  }

  const rentToIncomeRatio = (proposedMonthlyRent / grossMonthlyIncome) * 100;
  const maxAffordableRent = grossMonthlyIncome * 0.3;

  if (rentToIncomeRatio <= 30) {
    return {
      isAffordable: true,
      rentToIncomeRatio,
      maxAffordableRent,
      recommendation: 'El arriendo es accesible según la Regla del 30%.',
      severity: 'ok',
    };
  }

  if (rentToIncomeRatio <= 35) {
    return {
      isAffordable: true,
      rentToIncomeRatio,
      maxAffordableRent,
      recommendation: `Arriendo accesible con margen ajustado. Considera negociar o buscar alternativas. Máximo recomendado: ${formatCurrency(maxAffordableRent)}`,
      severity: 'warning',
    };
  }

  return {
    isAffordable: false,
    rentToIncomeRatio,
    maxAffordableRent,
    recommendation: `El arriendo excede el 30% de tus ingresos. Buscar arriendo máximo de ${formatCurrency(maxAffordableRent)} para mantener estabilidad financiera.`,
    severity: 'danger',
  };
}

export interface VehicleAffordabilityResult {
  isAffordable: boolean;
  monthlyPayment: number;
  totalCost: number;
  breakdown: {
    downPayment: number;
    loanAmount: number;
    totalInterest: number;
    insuranceAndMaintenance: number;
  };
  recommendation: string;
  severity: 'ok' | 'warning' | 'danger';
}

export interface VehicleAffordabilityParams {
  grossMonthlyIncome: number;
  vehiclePrice: number;
  downPaymentPercent?: number;
  loanTermYears?: number;
  interestRateAnnual?: number;
  insuranceAndMaintenancePercent?: number;
}

export function calculateVehicleAffordability(
  params: VehicleAffordabilityParams
): VehicleAffordabilityResult {
  const {
    grossMonthlyIncome,
    vehiclePrice,
    downPaymentPercent = 20,
    loanTermYears = 4,
    interestRateAnnual = 0.18,
    insuranceAndMaintenancePercent = 10,
  } = params;

  if (grossMonthlyIncome <= 0 || vehiclePrice <= 0) {
    return {
      isAffordable: false,
      monthlyPayment: 0,
      totalCost: 0,
      breakdown: {
        downPayment: 0,
        loanAmount: 0,
        totalInterest: 0,
        insuranceAndMaintenance: 0,
      },
      recommendation: 'El ingreso y el precio del vehículo deben ser mayores a 0.',
      severity: 'danger',
    };
  }

  if (downPaymentPercent < 0 || downPaymentPercent > 100) {
    return {
      isAffordable: false,
      monthlyPayment: 0,
      totalCost: 0,
      breakdown: {
        downPayment: 0,
        loanAmount: 0,
        totalInterest: 0,
        insuranceAndMaintenance: 0,
      },
      recommendation: 'El porcentaje de pago inicial debe estar entre 0% y 100%.',
      severity: 'danger',
    };
  }

  if (loanTermYears > 4) {
    return {
      isAffordable: false,
      monthlyPayment: 0,
      totalCost: 0,
      breakdown: {
        downPayment: 0,
        loanAmount: 0,
        totalInterest: 0,
        insuranceAndMaintenance: 0,
      },
      recommendation: 'Para mayor accesibilidad, considera un plazo máximo de 4 años según la Regla 20/4/10.',
      severity: 'warning',
    };
  }

  const downPayment = vehiclePrice * (downPaymentPercent / 100);
  const loanAmount = vehiclePrice - downPayment;
  const monthlyInterestRate = interestRateAnnual / 12;

  const numberOfPayments = loanTermYears * 12;
  let monthlyPayment = 0;

  if (monthlyInterestRate > 0) {
    const factor = Math.pow(1 + monthlyInterestRate, numberOfPayments);
    monthlyPayment = loanAmount * (monthlyInterestRate * factor) / (factor - 1);
  } else {
    monthlyPayment = loanAmount / numberOfPayments;
  }

  const totalLoanCost = monthlyPayment * numberOfPayments;
  const totalInterest = totalLoanCost - loanAmount;

  const maxInsuranceAndMaintenance = grossMonthlyIncome * (insuranceAndMaintenancePercent / 100);

  const totalCost = downPayment + totalLoanCost + (maxInsuranceAndMaintenance * numberOfPayments);

  const affordableDownPayment = downPaymentPercent >= 20;
  const affordableTerm = loanTermYears <= 4;
  const affordableMonthlyPayment = monthlyPayment <= grossMonthlyIncome * 0.1;
  const affordableInsurance = maxInsuranceAndMaintenance <= grossMonthlyIncome * 0.1;

  if (affordableDownPayment && affordableTerm && affordableMonthlyPayment && affordableInsurance) {
    return {
      isAffordable: true,
      monthlyPayment,
      totalCost,
      breakdown: {
        downPayment,
        loanAmount,
        totalInterest,
        insuranceAndMaintenance: maxInsuranceAndMaintenance,
      },
      recommendation: 'El vehículo es accesible según la Regla 20/4/10.',
      severity: 'ok',
    };
  }

  const issues: string[] = [];
  if (!affordableDownPayment) issues.push(`Pago inicial bajo (${downPaymentPercent}% vs 20% recomendado)`);
  if (!affordableTerm) issues.push(`Plazo largo (${loanTermYears} años vs 4 máximo)`);
  if (!affordableMonthlyPayment) issues.push(`Cuota mensual alta (${((monthlyPayment / grossMonthlyIncome) * 100).toFixed(1)}% vs 10% máximo)`);
  if (!affordableInsurance) issues.push(`Seguro/mantenimiento alto`);

  return {
    isAffordable: false,
    monthlyPayment,
    totalCost,
    breakdown: {
      downPayment,
      loanAmount,
      totalInterest,
      insuranceAndMaintenance: maxInsuranceAndMaintenance,
    },
    recommendation: `Considera: ${issues.join('. ')}.`,
    severity: issues.length > 2 ? 'danger' : 'warning',
  };
}
