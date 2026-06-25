# Personal Finance Module - Plan de Implementación

> **Última actualización:** 2026-06-24
> **Estado:** Planificación completa - Listo para implementar

---

## 1. Visión General

El módulo **Personal Finance** es una herramienta de educación y gestión financiera personal. Cada usuario de la plataforma tiene control exclusivo sobre sus datos financieros; el Admin del workspace **no puede ver** los datos financieros de ningún otro usuario.

### Objetivos Principales
- Registro de ingresos y gastos personales
- Dashboard con métricas financieras (total income, expenses, net balance, debts)
- Fondo de emergencia con indicador de cobertura
- Goals (metas de ahorro) con plazos y aportes programados
- Reglas presupuestarias (50/30/20, 70/20/10, custom) con análisis visual
- Simuladores stateless (vivienda, vehículo) basados en reglas financieras
- Soporte multi-moneda (COP/USD)

### Constraints
- Admin **nunca** puede ver datos financieros de otros usuarios
- Módulo gratuito con **200 cuota/mes** (cada CRUD operation consume 1)
- Eliminación en cascada: al borrar usuario se eliminan sus datos financieros
- Sin integración con TransferCheck (módulo completamente independiente)

---

## 2. Arquitectura Multi-Inquilino

### Jerarquía de Datos
```
Workspace (Empresa/Admin)
└── Users (Empleados/Operadores)
    └── PersonalFinance Data [Aislado por workspace + user]
```

### Índice Compuesto Primario
Todos los esquemas incluyen:
```typescript
workspace: Types.ObjectId  // workspace._id
user: Types.ObjectId        // auth.userId
```

### Control de Acceso
| Rol | Permisos |
|-----|----------|
| Superadmin | Ve módulo en settings, no ve datos de usuarios |
| Admin (Empresa) | **NO puede ver** datos financieros de otros usuarios |
| Operador/Empleado | CRUD exclusivo sobre sus propios datos |

---

## 3. Categorías Predefinidas

### 3.1 Ingresos

#### Tipos: `recurrent` | `occasional`

**Recurrentes (por defecto):**
- Salario
- Pensión
- Arriendo (ingresos)
- Honorarios
- Inversiones/Fondos

**Ocasionales (por defecto):**
- Bonificación
- Prima
- Freelance
- Venta de activos
- Herencia/Regalo
- Reembolso
- Otros

### 3.2 Gastos

#### Tipos: `obligatory` | `savings_investment` | `discretionary`

**Obligatorios (por defecto):**
- Arriendo/Hipoteca
- Servicios (agua, luz, gas, internet)
- Alimentación/Hogar
- Transporte
- Salud/Seguros
- Educación
- Pago de deudas
- Suscripciones

**Ahorro e Inversiones (por defecto):**
- Ahorro emergencia
- Aportaciones a fondos
- Inversiones
- CDT
- Cesantías
- Aporte a metas

**Discrecionales (por defecto):**
- Entretenimiento
- Restaurantes
- Viajes
- Compras personales
- Hobbies
- Otros

### 3.3 Deudas - Tipos
- Tarjeta de crédito
- Préstamo de consumo
- Préstamo vehicular
- Préstamo hipotecario
- Microcrédito
- Deuda con familiar/amigo
- Otro

### 3.4 Categorías Editables
- Admin del módulo puede agregar nuevas categorías
- Categorías nuevas aparecen automáticamente en ingresos/egresos
- Las categorías por defecto no se pueden eliminar

---

## 4. Esquemas de Base de Datos

### 4.1 `personalfinance-summary.ts`

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPersonalFinanceSummary {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  currency: 'COP' | 'USD';
  billingCycleDay: number; // 1-28, día de inicio del período mensual
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceSummarySchema = new Schema<IPersonalFinanceSummary>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currency: { type: String, enum: ['COP', 'USD'], default: 'COP' },
    billingCycleDay: { type: Number, min: 1, max: 28, default: 1 },
  },
  { timestamps: true }
);

PersonalFinanceSummarySchema.index({ workspace: 1, user: 1 }, { unique: true });

export const PersonalFinanceSummary =
  mongoose.models.PersonalFinanceSummary ||
  mongoose.model<IPersonalFinanceSummary>('PersonalFinanceSummary', PersonalFinanceSummarySchema);
```

### 4.2 `personalfinance-income.ts`

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export type IncomeType = 'recurrent' | 'occasional';

export interface IPersonalFinanceIncome {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  type: IncomeType;
  category: string;
  amount: number;
  currency: 'COP' | 'USD';
  description?: string;
  date: Date; // Fecha de la transacción
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
```

### 4.3 `personalfinance-expense.ts`

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export type ExpenseType = 'obligatory' | 'savings_investment' | 'discretionary';
export type RecurringPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface IPersonalFinanceExpense {
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
  linkedGoalId?: Types.ObjectId; // Si es aporte a una meta
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceExpenseSchema = new Schema<IPersonalFinanceExpense>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['obligatory', 'savings_investment', 'discretionary'], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['COP', 'USD'], required: true },
    isRecurrent: { type: Boolean, default: false },
    recurringPeriod: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    description: { type: String },
    date: { type: Date, required: true },
    linkedGoalId: { type: Schema.Types.ObjectId, ref: 'PersonalFinanceGoal' },
  },
  { timestamps: true }
);

PersonalFinanceExpenseSchema.index({ workspace: 1, user: 1, createdAt: -1 });
PersonalFinanceExpenseSchema.index({ workspace: 1, user: 1, type: 1 });
PersonalFinanceExpenseSchema.index({ workspace: 1, user: 1, date: -1 });

export const PersonalFinanceExpense =
  mongoose.models.PersonalFinanceExpense ||
  mongoose.model<IPersonalFinanceExpense>('PersonalFinanceExpense', PersonalFinanceExpenseSchema);
```

### 4.4 `personalfinance-debt.ts`

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export type DebtType = 'credit_card' | 'personal_loan' | 'vehicle_loan' | 'mortgage' | 'microcredit' | 'family_loan' | 'other';
export type DebtStatus = 'active' | 'paid' | 'restructured';

export interface IPersonalFinanceDebt {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  debtType: DebtType;
  creditor: string;
  originalAmount: number;
  currentBalance: number; // Saldo pendiente actual
  currency: 'COP' | 'USD';
  interestRate: number; // Tasa de interés mensual (%)
  monthlyPayment: number; // Cuota mensual
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
```

### 4.5 `personalfinance-budget-rule.ts`

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBudgetPercentages {
  obligatory: number;
  savingsInvestment: number;
  discretionary: number;
}

export interface IPersonalFinanceBudgetRule {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  name: string; // "50/30/20", "70/20/10", "Personalizada"
  percentages: IBudgetPercentages;
  isActive: boolean;
  isCustom: boolean; // Si es regla personalizada del usuario
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceBudgetRuleSchema = new Schema<IPersonalFinanceBudgetRule>(
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

// Validación: la suma debe ser exactamente 100
PersonalFinanceBudgetRuleSchema.pre('validate', function (next) {
  const total =
    (this.percentages?.obligatory || 0) +
    (this.percentages?.savingsInvestment || 0) +
    (this.percentages?.discretionary || 0);

  if (total !== 100) {
    this.invalidate(
      'percentages',
      `Los porcentajes deben sumar exactamente 100%. Suma actual: ${total}%`
    );
  }
  next();
});

PersonalFinanceBudgetRuleSchema.index({ workspace: 1, user: 1, isActive: 1 });

export const PersonalFinanceBudgetRule =
  mongoose.models.PersonalFinanceBudgetRule ||
  mongoose.model<IPersonalFinanceBudgetRule>('PersonalFinanceBudgetRule', PersonalFinanceBudgetRuleSchema);
```

### 4.6 `personalfinance-emergency-fund.ts`

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPersonalFinanceEmergencyFund {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  currentBalance: number;
  targetMonths: number; // Meses objetivo de cobertura (default: 6)
  monthlyContribution: number; // Aportación mensual automática
  currency: 'COP' | 'USD';
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceEmergencyFundSchema = new Schema<IPersonalFinanceEmergencyFund>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currentBalance: { type: Number, default: 0, min: 0 },
    targetMonths: { type: Number, default: 6, min: 1, max: 24 },
    monthlyContribution: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: ['COP', 'USD'], required: true },
  },
  { timestamps: true }
);

PersonalFinanceEmergencyFundSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const PersonalFinanceEmergencyFund =
  mongoose.models.PersonalFinanceEmergencyFund ||
  mongoose.model<IPersonalFinanceEmergencyFund>('PersonalFinanceEmergencyFund', PersonalFinanceEmergencyFundSchema);
```

### 4.7 `personalfinance-savings-goal.ts`

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export type GoalStatus = 'in_progress' | 'completed' | 'paused';

export interface IPersonalFinanceSavingsGoal {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number; // Lo ahorrado hasta ahora
  currency: 'COP' | 'USD';
  startDate: Date;
  targetDate?: Date; // Fecha límite
  targetMonths?: number; // O plazo en meses (mutuamente excluyente con targetDate)
  suggestedMonthlyContribution: number; // Calculado automáticamente
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceSavingsGoalSchema = new Schema<IPersonalFinanceSavingsGoal>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: ['COP', 'USD'], required: true },
    startDate: { type: Date, required: true },
    targetDate: { type: Date },
    targetMonths: { type: Number, min: 1, max: 120 },
    suggestedMonthlyContribution: { type: Number, default: 0 },
    status: { type: String, enum: ['in_progress', 'completed', 'paused'], default: 'in_progress' },
  },
  { timestamps: true }
);

// Validación: targetDate o targetMonths debe estar presente, no ambos
PersonalFinanceSavingsGoalSchema.pre('validate', function (next) {
  if (!this.targetDate && !this.targetMonths) {
    this.invalidate('targetDate', 'Debe especificar targetDate o targetMonths');
  }
  if (this.targetDate && this.targetMonths) {
    this.invalidate('targetDate', 'No puede especificar ambos: targetDate y targetMonths');
  }
  next();
});

PersonalFinanceSavingsGoalSchema.index({ workspace: 1, user: 1, status: 1 });
PersonalFinanceSavingsGoalSchema.index({ workspace: 1, user: 1, createdAt: -1 });

export const PersonalFinanceSavingsGoal =
  mongoose.models.PersonalFinanceSavingsGoal ||
  mongoose.model<IPersonalFinanceSavingsGoal>('PersonalFinanceSavingsGoal', PersonalFinanceSavingsGoalSchema);
```

### 4.8 `personalfinance-category.ts`

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export type IncomeType = 'recurrent' | 'occasional';
export type ExpenseType = 'obligatory' | 'savings_investment' | 'discretionary';

export interface IPersonalFinanceCategory {
  workspace: Types.ObjectId;
  user?: Types.ObjectId; // null = categoría global del workspace
  type: 'income' | 'expense';
  incomeType?: IncomeType; // Solo para income
  expenseType?: ExpenseType; // Solo para expense
  name: string;
  isDefault: boolean; // Si es categoría por defecto del sistema
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalFinanceCategorySchema = new Schema<IPersonalFinanceCategory>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // null = global
    type: { type: String, enum: ['income', 'expense'], required: true },
    incomeType: { type: String, enum: ['recurrent', 'occasional'] },
    expenseType: { type: String, enum: ['obligatory', 'savings_investment', 'discretionary'] },
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PersonalFinanceCategorySchema.index({ workspace: 1, user: 1, type: 1 });
PersonalFinanceCategorySchema.index({ workspace: 1, user: 1, isActive: 1 });

export const PersonalFinanceCategory =
  mongoose.models.PersonalFinanceCategory ||
  mongoose.model<IPersonalFinanceCategory>('PersonalFinanceCategory', PersonalFinanceCategorySchema);
```

### 4.9 `debt-payment.ts` ✅

```typescript
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
```

### 4.10 `savings-investment.ts` ✅

```typescript
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
```

### 4.11 `financial-position.ts` ✅

```typescript
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
```

### 4.12 `emergency-fund.ts` ✅

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmergencyFund extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  linkedExpenseId: Types.ObjectId;
  savedAmount: number;
  monthsCompleted: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyFundSchema = new Schema<IEmergencyFund>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    linkedExpenseId: { type: Schema.Types.ObjectId, ref: 'PersonalFinanceExpense', required: true },
    savedAmount: { type: Number, default: 0, min: 0 },
    monthsCompleted: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EmergencyFundSchema.index({ workspace: 1, user: 1 }, { unique: true });
EmergencyFundSchema.index({ linkedExpenseId: 1 });

export const EmergencyFund =
  mongoose.models.EmergencyFund ||
  mongoose.model<IEmergencyFund>('EmergencyFund', EmergencyFundSchema);
```

### 4.13 Helper: `recalculateFinancialPosition()` ✅

Ubicación: `src/lib/modules/personalfinance/financial-position.ts`

Calcula y persiste la posición financiera agregada:

```typescript
export async function recalculateFinancialPosition(
  workspaceId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<FinancialPositionData> {
  // Agregaciones paralelas con Promise.all():
  // - PersonalFinanceIncome (total)
  // - PersonalFinanceExpense (total)
  // - PersonalFinanceDebt active (suma de currentBalance)
  // - DebtPayment (suma de principalPortion = totalDebtPaid)
  // - EmergencyFund (savedAmount)
  // - SavingsInvestment active (suma de currentBalance)

  // availableMoney = totalIncome - totalExpenses - totalDebtBalance + emergencyFundBalance + totalSavingsInvested

  // Guarda snapshot mensual actual
  // Upsert en FinancialPosition con returnDocument: 'after'
}
```

**Fórmula del patrimonio:**
```
availableMoney = totalIncome - totalExpenses - totalDebtBalance + emergencyFundBalance + totalSavingsInvested
```

---

## 5. Utilidades Financieras (Stateless)

### 5.1 `src/lib/modules/personalfinance/calculators.ts`

```typescript
// =============================================================================
// SIMULADORES
// =============================================================================

export interface HousingAffordabilityResult {
  isAffordable: boolean;
  rentToIncomeRatio: number; // Porcentaje
  maxAffordableRent: number;
  recommendation: string;
  severity: 'ok' | 'warning' | 'danger';
}

/**
 * Simulador de Vivienda - Regla del 30%
 * https://www.investopedia.com/updates/study-30-percent-rule-income/
 *
 * @param grossMonthlyIncome - Ingreso mensual bruto del usuario
 * @param proposedMonthlyRent - Arriendo mensual propuesto
 * @returns Resultado con accesibilidad y recomendación
 */
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
      recommendation: `Arriendo accesible con margen ajustado. Considera negociar o buscar alternativas. Maximo recomendado: ${formatCurrency(maxAffordableRent)}`,
      severity: 'warning',
    };
  }

  return {
    isAffordable: false,
    rentToIncomeRatio,
    maxAffordableRent,
    recommendation: `El arriendo excede el 30% de tus ingresos. Buscar arriendo maximo de ${formatCurrency(maxAffordableRent)} para mantener estabilidad financiera.`,
    severity: 'danger',
  };
}

// =============================================================================

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
  downPaymentPercent?: number; // default 20
  loanTermYears?: number; // max 4
  interestRateAnnual?: number; // Tasa anual (ej: 18% = 0.18)
  insuranceAndMaintenancePercent?: number; // default 10
}

/**
 * Simulador de Vehículo - Regla 20/4/10
 * https://www.nerdwallet.com/article/loans/auto/20-4-10-car-affordability-rule
 *
 * 20% - Pago inicial
 * 4 años - Plazo maximo de financiamiento
 * 10% - Costos totales (seguro + mantenimiento) de ingresos mensuales
 *
 * @param params - Parametros del simulador
 * @returns Resultado con accesibilidad y desglose
 */
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
      recommendation: 'El ingreso y el precio del vehiculo deben ser mayores a 0.',
      severity: 'danger',
    };
  }

  // Validaciones de regla
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
      recommendation: 'Para mayor accesibilidad, considera un plazo maximo de 4 años segun la Regla 20/4/10.',
      severity: 'warning',
    };
  }

  // Calculos
  const downPayment = vehiclePrice * (downPaymentPercent / 100);
  const loanAmount = vehiclePrice - downPayment;
  const monthlyInterestRate = interestRateAnnual / 12;

  // Formula de amortizacion: M = P * [r(1+r)^n] / [(1+r)^n - 1]
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

  // Seguro y mantenimiento (10% de ingresos mensuales)
  const maxInsuranceAndMaintenance = grossMonthlyIncome * (insuranceAndMaintenancePercent / 100);

  // Costo total del vehiculo (todo lo que pagas)
  const totalCost = downPayment + totalLoanCost + (maxInsuranceAndMaintenance * numberOfPayments);

  // Costo total como porcentaje de ingresos
  const totalCostToIncomeRatio = (totalCost / (grossMonthlyIncome * numberOfPayments)) * 100;

  // Evaluacion
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
      recommendation: 'El vehiculo es accesible segun la Regla 20/4/10.',
      severity: 'ok',
    };
  }

  // Generar recomendaciones especificas
  const issues: string[] = [];
  if (!affordableDownPayment) issues.push(`Pago inicial bajo (${downPaymentPercent}% vs 20% recomendado)`);
  if (!affordableTerm) issues.push(`Plazo largo (${loanTermYears} años vs 4 maximo)`);
  if (!affordableMonthlyPayment) issues.push(`Cuota mensual alta (${((monthlyPayment / grossMonthlyIncome) * 100).toFixed(1)}% vs 10% maximo)`);
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

// =============================================================================
// FONDO DE EMERGENCIA
// =============================================================================

export interface EmergencyFundCoverageResult {
  monthsCovered: number;
  isSufficient: boolean; // >= 6 meses
  recommendation: string;
  severity: 'ok' | 'warning' | 'danger';
}

/**
 * Calcula meses de cobertura del fondo de emergencia
 *
 * @param emergencyFundBalance - Saldo actual del fondo
 * @param monthlyRecurringExpenses - Gastos recurrentes mensuales
 * @param targetMonths - Meses objetivo (default 6)
 * @returns Resultado con cobertura y recomendaciones
 */
export function calculateEmergencyFundCoverage(
  emergencyFundBalance: number,
  monthlyRecurringExpenses: number,
  targetMonths: number = 6
): EmergencyFundCoverageResult {
  if (monthlyRecurringExpenses <= 0) {
    return {
      monthsCovered: 0,
      isSufficient: false,
      recommendation: 'Los gastos recurrentes deben ser mayores a 0 para calcular la cobertura.',
      severity: 'danger',
    };
  }

  const monthsCovered = emergencyFundBalance / monthlyRecurringExpenses;

  if (monthsCovered >= targetMonths) {
    return {
      monthsCovered,
      isSufficient: true,
      recommendation: `Tienes ${monthsCovered.toFixed(1)} meses de cobertura. Tu fondo de emergencia esta completo.`,
      severity: 'ok',
    };
  }

  if (monthsCovered >= 3) {
    const monthsNeeded = targetMonths - monthsCovered;
    const recommendation = monthlyRecurringExpenses > 0
      ? `Estas cerca. Necesitas ${formatCurrency(monthlyRecurringExpenses * monthsNeeded)} mas para alcanzar ${targetMonths} meses.`
      : 'Completa tu fondo de emergencia.';

    return {
      monthsCovered,
      isSufficient: false,
      recommendation,
      severity: 'warning',
    };
  }

  const monthsNeeded = targetMonths - monthsCovered;
  const recommendation = monthlyRecurringExpenses > 0
    ? `Prioriza tu fondo de emergencia. Necesitas ${formatCurrency(monthlyRecurringExpenses * monthsNeeded)} mas para ${targetMonths} meses de cobertura.`
    : 'Construye tu fondo de emergencia inmediatamente.';

  return {
    monthsCovered,
    isSufficient: false,
    recommendation,
    severity: 'danger',
  };
}

// =============================================================================
// ANALISIS DE REGLAS PRESUPUESTARIAS
// =============================================================================

export interface BudgetAnalysisCategory {
  theoreticalPercentage: number;
  actualPercentage: number;
  actualAmount: number;
  difference: number; // Positivo = sobrante, Negativo = excedido
  status: 'ok' | 'warning' | 'over'; // ok = dentro de rango, warning = cerca del limite, over = excedido
}

export interface BudgetAnalysisResult {
  isCompliant: boolean;
  obligatory: BudgetAnalysisCategory;
  savingsInvestment: BudgetAnalysisCategory;
  discretionary: BudgetAnalysisCategory;
  totalIncome: number;
  totalSpent: number;
  overview: {
    percentage: number; // Porcentaje total gastado
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

/**
 * Analiza el cumplimiento de una regla presupuestaria
 *
 * @param actualSpend - Gastos reales por categoria
 * @param percentages - Porcentajes teoricos de la regla
 * @param totalIncome - Ingreso total del periodo
 * @returns Resultado detallado del analisis
 */
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

    // Umbrales: ok = dentro de +/- 5%, warning = 5-10% fuera, over = >10% fuera
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

// =============================================================================
// HELPERS
// =============================================================================

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
```

---

## 6. Estructura de API Routes

### 6.1 Endpoint Summary ✅

```
/api/modules/personalfinance/
├── GET              → Obtener quota del módulo
│
├── summary/
│   ├── GET          → Obtener/crear summary del usuario (currency, billingCycleDay) ✅
│   └── PUT          → Actualizar summary ✅
│
├── incomes/
│   ├── GET          → Lista de ingresos (filtros: mes, tipo) ✅
│   ├── POST         → Crear ingreso (+1 quota) ✅
│   ├── PUT/:id      → Actualizar ingreso ✅
│   └── DELETE/:id   → Eliminar ingreso ✅
│
├── expenses/
│   ├── GET          → Lista de gastos (filtros: mes, tipo) ✅
│   ├── POST         → Crear gasto (+1 quota) ✅
│   ├── PUT/:id      → Actualizar gasto ✅
│   └── DELETE/:id   → Eliminar gasto ✅
│
├── debts/
│   ├── GET          → Lista de deudas (filtros: status) ✅
│   ├── POST         → Crear deuda (+1 quota) ✅
│   ├── PUT/:id      → Actualizar deuda ✅
│   ├── DELETE/:id   → Eliminar deuda ✅
│   └── POST/:id/payment → Registrar pago a deuda ✅
│       Params: { amount, includeInterest: boolean }
│       - includeInterest=true (default): añade intereses mensuales al pago
│       - Calcula principalPortion e interestPortion automáticamente
│       - Actualiza debt.currentBalance y status (paid si balance=0)
│       - Crea DebtPayment con historial completo
│       - Llama recalculateFinancialPosition()
│
├── savings-investments/ ✅ (NUEVO)
│   ├── GET          → Lista de inversiones/ahorros (filtros: type, status) ✅
│   ├── POST         → Crear inversión/ahorro (+1 quota) ✅
│   ├── PUT/:id      → Actualizar ✅
│   └── DELETE/:id   → Eliminar ✅
│
├── financial-position/ ✅ (NUEVO)
│   ├── GET          → Obtener posición financiera agregada ✅
│   │   Returns: { totalIncome, totalExpenses, totalSavingsInvested,
│   │             emergencyFundBalance, totalDebtBalance, totalDebtPaid,
│   │             availableMoney, snapshots[] }
│   └── POST         → Recalcular y guardar (usado internamente) ✅
│
├── emergency-fund/
│   ├── GET          → Obtener fondo de emergencia ✅
│   └── PUT          → Actualizar fondo (balance, targetMonths, contribution) ✅
│
├── budget-rules/
│   ├── GET          → Lista de reglas
│   ├── POST         → Crear regla (+1 quota)
│   ├── PUT/:id      → Actualizar regla
│   ├── DELETE/:id   → Eliminar regla
│   └── PUT/:id/activate → Activar regla (desactiva otras)
│
├── goals/
│   ├── GET          → Lista de metas
│   ├── POST         → Crear meta (+1 quota)
│   ├── PUT/:id      → Actualizar meta
│   ├── DELETE/:id   → Eliminar meta
│   └── PUT/:id/contribute → Agregar aporte a meta
│
├── categories/
│   ├── GET          → Lista de categorías (default + custom)
│   ├── POST         → Crear categoría custom (+1 quota)
│   └── DELETE/:id   → Eliminar categoría custom (no default)
│
├── years/ ✅ (NUEVO - utilidad)
│   └── GET          → Obtener años con datos para selector dinámico
│
└── simulators/
    ├── POST/housing → Simulador de vivienda (stateless)
    └── POST/vehicle → Simulador de vehículo (stateless)
```

### 6.2 Patrón de Autenticación

```typescript
// GET /api/modules/personalfinance/incomes
export async function GET(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar feature toggle
  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  // Consumir quota
  const { allowed, remaining } = await consumeQuota(auth.workspaceId, 'personalfinance');
  if (!allowed) {
    return NextResponse.json(
      { error: 'Cuota mensual excedida', remaining: 0 },
      { status: 429 }
    );
  }

  // Logica...
}
```

### 6.3 Estructura de Respuesta

```typescript
// Success (lista)
{
  items: [...],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}

// Success (single)
{
  ...entity
}

// Error
{
  error: string,
  details?: any
}
```

---

## 7. UI - Estructura de Componentes

### 7.1 Página Principal

```
src/app/(modules)/personalfinance/page.tsx
```

### 7.2 Layout de Tabs

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Icono] Finanzas Personales                                    [COP|USD]│
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Cuota mensual                                     45 / 200          ││
│  │ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ││
│  └─────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│  [ Principal ] [ Ingresos ] [ Egresos ] [ Deudas ] [ Reglas ] [ Metas ] [ Simu ]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CONTENT                                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Tab Principal (Dashboard)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PRINCIPAL                                [ Mes: Junio 2026 ▼ ]          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ 📈 INGRESOS     │  │ 📉 GASTOS       │  │ 💰 SALDO NETO  │         │
│  │ $5.500.000      │  │ $3.200.000      │  │ $2.300.000      │         │
│  │ vs mes anterior │  │ vs mes anterior │  │ vs mes anterior │         │
│  │ ↑ 12%           │  │ ↓ 5%            │  │ ↑ 23%           │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🏦 DEUDAS ACTIVAS                                                  ││
│  │ $18.500.000                                           [Ver detalles →]││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🛡️ FONDO DE EMERGENCIA                                             ││
│  │                                                                         ││
│  │  Saldo: $4.500.000    Aporte mensual: $200.000    Meta: 6 meses      ││
│  │                                                                         ││
│  │  Cobertura: ████████░░░░ 4.5 meses ⚠️ Necesitas 1.5 meses más      ││
│  │                                                                         ││
│  │  [ Configurar ]                                                       ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🎯 METAS PRIORITARIAS                                               ││
│  │                                                                         ││
│  │  🏎️ Prima para carro        $8.000.000 / $20.000.000    ████░░ 40% ││
│  │     6 meses restantes       $1.7M/mesneeded                              ││
│  │                                                                         ││
│  │  ✈️ Vacaciones 2026          $1.200.000 / $5.000.000     ██░░░░ 24% ││
│  │     4 meses restantes       $950K/mesneeded                             ││
│  │                                                                         ││
│  │                                                         [Ver todas →]  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 📊 RESUMEN DE REGLAS (50/30/20 activa)                              ││
│  │                                                                         ││
│  │  Obligatorios   │ 50% ($2.750K) │ ████████████████░░░░░ │ 67% 🔴    ││
│  │  Ahorro/Inv     │ 30% ($1.650K) │ ████░░░░░░░░░░░░░░░░ │ 13% 🟢    ││
│  │  Discrecional   │ 20% ($1.100K) │ ████████░░░░░░░░░░░░ │ 40% 🟡    ││
│  │                                                                         ││
│  │  ⚠️ Excediste en Obligatorios (+$467K). Considera reducir gastos.     ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Tab Ingresos

```
┌─────────────────────────────────────────────────────────────────────────┐
│ INGRESOS                                    [ + Agregar Ingreso ]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filtros: [ Tipo: Todos ▼ ] [ Mes: Junio 2026 ▼ ] [ Buscar... ]       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Tipo      │ Categoría      │ Monto         │ Fecha    │ Acciones    ││
│  ├───────────┼────────────────┼───────────────┼──────────┼─────────────││
│  │ Recurrente│ Salario        │ $4.500.000    │ 01/06    │ ✏️ 🗑️      ││
│  │ Recurrente│ Freelance      │ $800.000      │ 15/06    │ ✏️ 🗑️      ││
│  │ Ocasional │ Bonificación   │ $200.000      │ 10/06    │ ✏️ 🗑️      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  Total: $5.500.000                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Tab Egresos

```
┌─────────────────────────────────────────────────────────────────────────┐
│ EGRESOS                                    [ + Agregar Egreso ]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filtros: [ Tipo: Todos ▼ ] [ Mes: Junio 2026 ▼ ] [ Buscar... ]       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Tipo          │ Categoría       │ Monto        │ Recurrente │ Acciones││
│  ├───────────────┼────────────────┼──────────────┼────────────┼─────────││
│  │ Obligatorio   │ Arriendo       │ $1.200.000   │ Mensual    │ ✏️ 🗑️  ││
│  │ Obligatorio   │ Servicios      │ $300.000     │ Mensual    │ ✏️ 🗑️  ││
│  │ Obligatorio   │ TC Banco X     │ $500.000     │ Mensual    │ ✏️ 🗑️  ││
│  │ Ahorro/Inv    │ Aporte Meta    │ $200.000     │ Mensual    │ ✏️ 🗑️  ││
│  │ Discrecional  │ Restaurantes   │ $400.000     │ No         │ ✏️ 🗑️  ││
│  │ Discrecional  │ Entretenimiento│ $600.000     │ No         │ ✏️ 🗑️  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  Total: $3.200.000                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.6 Tab Deudas

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DEUDAS                                        [ + Agregar Deuda ]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filtros: [ Estado: Activas ▼ ]                                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Tipo          │ Acreedor        │ Original    │ Saldo       │ Acciones│
│  ├───────────────┼────────────────┼─────────────┼─────────────┼─────────││
│  │ TC Oro        │ Banco Bogotá   │ $5.000.000 │ $3.200.000  │ ✏️ 🗑️  ││
│  │ Préstamo car  │ Banco Popular  │ $50.000.000│ $45.500.000 │ ✏️ 🗑️  ││
│  │ Microcrédito  │ Juan Pérez     │ $2.000.000 │ $800.000    │ ✏️ 🗑️  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  Total deudas activas: $49.500.000                                     │
│  Pago mensual total: $1.500.000                                        │
│                                                                         │
│  [+ Registrar Pago] → Modal: Seleccionar deuda + monto                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.7 Tab Reglas

```
┌─────────────────────────────────────────────────────────────────────────┐
│ REGLAS                                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Selecciona una regla o crea una personalizada:                        │
│                                                                         │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌──────────────┐│
│  │   50/30/20     │ │   70/20/10    │ │  40/30/30     │ │+ Personalizada││
│  │   [Activar]    │ │   [Activar]   │ │   [Activar]   │ │              ││
│  └────────────────┘ └────────────────┘ └────────────────┘ └──────────────┘│
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────│
│                                                                         │
│  REGLA 50/30/20 (Activa)                                    [Editar]   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    │ Teórico │  Actual │ Diferencia                ││
│  ├────────────────────┼─────────┼─────────┼────────────────────────────││
│  │ Obligatorios       │  50%    │  67%    │  +17% ████████████████ 🔴  ││
│  │ Ahorro/Inversión   │  30%    │  13%    │  -17% ███████░░░░░░░░ 🟢  ││
│  │ Discrecional       │  20%    │  20%    │   0%  ██████████░░░░░░ ⚪  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ⚠️ Excediste en Obligatorios. Recomendación: Revisa gastos en        │
│     Arriendo y TC. Necesitas reducir $467K para estar en regla.        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.8 Tab Reglas - Personalizada

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AGREGAR REGLA PERSONALIZADA                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Nombre de la regla: [ Mi Plan Personal        ]                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Categoría              │ Porcentaje                                 ││
│  ├────────────────────────┼────────────────────────────────────────────││
│  │ Obligatorios           │ [ 40 ] %  ████████████████                  ││
│  │ Ahorro/Inversión       │ [ 30 ] %  ████████████                       ││
│  │ Discrecional           │ [ 30 ] %  ████████████                       ││
│  ├────────────────────────┼────────────────────────────────────────────││
│  │ TOTAL                 │  100%  ✓                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  [+ Agregar categoría] → Nueva fila editable                           │
│                                                                         │
│  [ Cancelar ]  [ Guardar Regla ]                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.9 Tab Metas

```
┌─────────────────────────────────────────────────────────────────────────┐
│ METAS                                              [ + Nueva Meta ]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🏎️ Prima para carro                                               ││
│  │                                                                     ││
│  │  $8.000.000 / $20.000.000                                          ││
│  │  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  40%        ││
│  │                                                                     ││
│  │  Fecha objetivo: 15 Dic 2026 (6 meses)                             ││
│  │  Aporte sugerido: $1.700.000/mes                                   ││
│  │  Aporte actual: $200.000/mes ⚠️ Atrasado                           ││
│  │                                                                     ││
│  │  [ Aportar + ]  [ Pausar ]  [ ✏️ ]  [ 🗑️ ]                        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ✈️ Vacaciones 2026                                                 ││
│  │                                                                     ││
│  │  $1.200.000 / $5.000.000                                          ││
│  │  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  24%        ││
│  │                                                                     ││
│  │  Fecha objetivo: 01 Oct 2026 (4 meses)                             ││
│  │  Aporte sugerido: $950.000/mes                                     ││
│  │  Aporte actual: $300.000/mes ⚠️ Atrasado                           ││
│  │                                                                     ││
│  │  [ Aportar + ]  [ Pausar ]  [ ✏️ ]  [ 🗑️ ]                        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🏠 Casa - Ahorro apartamento                                       ││
│  │                                                                     ││
│  │  $3.000.000 / $30.000.000                                         ││
│  │  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10%        ││
│  │                                                                     ││
│  │  Plazo: 18 meses                                                   ││
│  │  Aporte sugerido: $1.500.000/mes                                   ││
│  │  Aporte actual: $1.500.000/mes ✅ En curso                         ││
│  │                                                                     ││
│  │  [ Aportar + ]  [ Pausar ]  [ ✏️ ]  [ 🗑️ ]                        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.10 Tab Simuladores

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SIMULADORES                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [ 🏠 Vivienda ]  [ 🚗 Vehículo ]                                      │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────│
│                                                                         │
│  SIMULADOR DE VIVIENDA                                                  │
│  https://www.investopedia.com/updates/study-30-percent-rule-income/    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Ingreso mensual bruto:                                            ││
│  │  [$ 5.000.000                      ] COP                            ││
│  │                                                                     ││
│  │  Arriendo mensual propuesto:                                       ││
│  │  [$ 1.800.000                     ] COP                            ││
│  │                                                                     ││
│  │  [    Calcular     ]                                               ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  RESULTADO:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Ratio arriendo/ingreso: 36%  ⚠️                                   ││
│  │                                                                     ││
│  │  🔴 EXCEDE EL LIMITE DEL 30%                                       ││
│  │                                                                     ││
│  │  El arriendo excede el 30% de tus ingresos.                        ││
│  │  Arriendo maximo recomendado: $1.500.000                           ││
│  │                                                                     ││
│  │  Tu excedente: $300.000 (6% sobre el limite)                       ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.11 Tab Simuladores - Vehículo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SIMULADORES                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [ 🏠 Vivienda ]  [ 🚗 Vehículo ]                                      │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────│
│                                                                         │
│  SIMULADOR DE VEHICULO                                                  │
│  Regla 20/4/10: 20% pago inicial, 4 años max, 10% ingresos             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Ingreso mensual bruto:                                            ││
│  │  [$ 5.000.000                      ] COP                           ││
│  │                                                                     ││
│  │  Precio del vehiculo:                                              ││
│  │  [$ 80.000.000                     ] COP                           ││
│  │                                                                     ││
│  │  Pago inicial (%):                                                 ││
│  │  [$ 20                        ] %  (default 20%)                  ││
│  │                                                                     ││
│  │  Plazo (años):                                                     ││
│  │  [$ 4                        ]    (max 4 años)                    ││
│  │                                                                     ││
│  │  Tasa de interes anual (%):                                        ││
│  │  [$ 18                       ] %                                   ││
│  │                                                                     ││
│  │  [    Calcular     ]                                               ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  RESULTADO:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  ✅ ACCESIBLE SEGUN REGLA 20/4/10                                   ││
│  │                                                                     ││
│  │  Cuota mensual estimada: $1.825.000                                 ││
│  │  (36.5% de tus ingresos - dentro del limite del 50%)              ││
│  │                                                                     ││
│  │  ─────────────────────────────────────────                         ││
│  │  Desglose:                                                         ││
│  │  • Pago inicial: $16.000.000 (20%)                                ││
│  │  • Monto del prestamo: $64.000.000                                 ││
│  │  • Intereses totales: $23.600.000                                  ││
│  │  • Seguro + mantenimiento/mes: $500.000 (10%)                       ││
│  │  ─────────────────────────────────────────                         ││
│  │  Costo total del vehiculo: $120.500.000                            ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Plan de Iteraciones y Tests Manuales

### ITERACIÓN 1: Fundamentos y CRUD ✅
**Objetivo:** Crear esquemas, API básica, UI skeleton con tabs

**Pasos:**
1. [x] Crear ModuleSubscription para personalfinance (key: 'personalfinance', name: 'Finanzas Personales', quota: 200)
2. [x] Crear esquemas Mongoose (Summary, Income, Expense)
3. [x] Crear API routes: summary (GET/PUT), incomes (CRUD), expenses (CRUD)
4. [x] Crear UI: tabs Principal + Ingresos + Egresos + Quota component
5. [x] Implementar selector de mes (billingCycleDay)
6. [x] Selector de año dinámico basado en datos reales
7. [x] Consumo de quota por tab con prevRef para evitar doble ejecución
8. [ ] Test: Admin NO ve datos de otros usuarios (403)
9. [ ] Test: Usuario puede CRUD sus propios datos
10. [ ] Test: Quota se consume en cada CREATE
11. [ ] Test: Selector de mes filtra correctamente

### ITERACIÓN 2: Deudas ✅
**Objetivo:** Sistema completo de deudas con pagos

**Pasos:**
1. [x] Crear esquema Debt con tipos, saldos, status
2. [x] Crear esquema DebtPayment para historial de pagos (principalPortion, interestPortion, balanceAfter)
3. [x] Crear API routes: debts (CRUD) + payment endpoint con opción "incluir intereses"
4. [x] Integrar en UI: tab Deudas + columna en Principal con Préstamo, Saldo, Cuota, Interés mes
5. [ ] Test: Registrar deuda nueva
6. [ ] Test: Registrar pago descuenta del saldo
7. [ ] Test: Deuda pagada aparece como "paid" pero se mantiene historial
8. [ ] Test: Admin NO ve deudas de otros usuarios

**Fix crítico implementado (2026-06-24):** El endpoint de payment (`POST /debts/[id]/payment`) ejecutaba `dbConnect()` después de `checkFeatureEnabled()`, causando timeout en Vercel. Solución: agregar `dbConnect()` dentro de `getAppSettings()` en `src/lib/models/app-settings.ts`.

### ITERACIÓN 3: Reglas Presupuestarias
**Objetivo:** Motor de reglas con validación 100% y análisis visual

**Pasos:**
1. [ ] Crear esquema BudgetRule con validación 100%
2. [ ] Crear API routes: budget-rules (CRUD) + activate
3. [ ] Implementar utils analyzeBudgetRule()
4. [ ] UI: tabs de reglas predefinidas (50/30/20, 70/20/10)
5. [ ] UI: Tab personalizada con campos editables
6. [ ] UI: Gráfica de análisis con colores (rojo/verde/amarillo)
7. [ ] Test: Crear regla custom suma != 100 → error de validación
8. [ ] Test: Gastar 67% en obligatorios con regla 50/30/20 → muestra +17% en rojo
9. [ ] Test: Activar regla desactiva otras

### ITERACIÓN 4: Fondo de Emergencia
**Objetivo:** Cálculo automático de cobertura

**Pasos:**
1. [ ] Crear esquema EmergencyFund
2. [ ] Crear API routes: emergency-fund (GET/PUT)
3. [ ] Implementar utils calculateEmergencyFundCoverage()
4. [ ] UI: Card en Principal con meses cubiertos + barra de progreso
5. [ ] Test: Cambiar gastos recurrentes → recalcula meses
6. [ ] Test: Fondo cubre 6+ meses → verde
7. [ ] Test: Fondo cubre < 3 meses → rojo con warning

### ITERACIÓN 5: Goals (Metas de Ahorro)
**Objetivo:** Sistema completo de metas con plazos y aportes

**Pasos:**
1. [ ] Crear esquema SavingsGoal
2. [ ] Crear API routes: goals (CRUD) + contribute endpoint
3. [ ] Implementar utils: calculateGoalProgress, calculateSuggestedContribution
4. [ ] UI: Tab Metas con cards de progreso
5. [ ] UI: Resumen en Principal (2-3 metas más cercanas al deadline)
6. [ ] Test: Crear meta con targetDate vs targetMonths
7. [ ] Test: Aporteautomatico marca como completado al llegar a 100%
8. [ ] Test: Meta pausada no aparece en "prioritarias"

### ITERACIÓN 6: Simuladores
**Objetivo:** Housing + Vehicle stateless calculators

**Pasos:**
1. [ ] Implementar utils calculateHousingAffordability() - Regla 30%
2. [ ] Implementar utils calculateVehicleAffordability() - Regla 20/4/10
3. [ ] Crear API POST /simulators (housing y vehicle)
4. [ ] UI: Tab Simuladores con subtabs Casa + Vehículo
5. [ ] Test: Ingreso 0 → maneja división por cero
6. [ ] Test: Down payment 50% → warning de validación
7. [ ] Test: Loan term 5 años → warning de que excede maximo

### ITERACIÓN 7: Integración Final
**Objetivo:** Feature toggle, moneda, categorías editables, seed data

**Pasos:**
1. [ ] Feature toggle personalFinanceEnabled en app-settings
2. [ ] Selector COP/USD en UI (persisted in Summary)
3. [ ] Esquema Category para categorías editables
4. [ ] API routes: categories (CRUD) - solo custom, no default
5. [ ] UI: Categorías nuevas aparecen en Ingresos/Egresos
6. [ ] Actualizar seed.ts con módulo + datos de ejemplo
7. [ ] Test: Moneda cambia afecta todos los valores mostrados
8. [ ] Test: Agregar categoría custom nueva → aparece en selects
9. [ ] Test: Admin ve módulo pero no puede ver datos de usuarios
10. [ ] Test end-to-end completo

---

## 9. Integración con el Dashboard Principal

### 9.1 Feature Toggle

En `src/lib/models/app-settings.ts` agregar:
```typescript
{
  key: 'personalFinanceEnabled',
  value: true,
  description: 'Habilitar modulo de Finanzas Personales',
  category: 'modules',
}
```

### 9.2 Módulo en Seed

```typescript
// En defaultModules
{
  key: 'personalfinance',
  name: 'Finanzas Personales',
  description: 'Gestiona tus finanzas personales, ingresos, gastos y metas de ahorro.',
  tier: 'free',
  status: 'active',
  defaultQuota: 200,
  visible: true,
  icon: 'piggy-bank',
}
```

### 9.3 Navegación

El módulo aparece en el sidebar del dashboard para usuarios con acceso.

---

## 10. Eliminación en Cascada

Cuando se elimina un usuario:
```typescript
// En User model o middleware
async function deleteUserData(userId: string, workspaceId: string) {
  await Promise.all([
    PersonalFinanceSummary.deleteMany({ user: userId, workspace: workspaceId }),
    PersonalFinanceIncome.deleteMany({ user: userId, workspace: workspaceId }),
    PersonalFinanceExpense.deleteMany({ user: userId, workspace: workspaceId }),
    PersonalFinanceDebt.deleteMany({ user: userId, workspace: workspaceId }),
    PersonalFinanceBudgetRule.deleteMany({ user: userId, workspace: workspaceId }),
    PersonalFinanceEmergencyFund.deleteMany({ user: userId, workspace: workspaceId }),
    PersonalFinanceSavingsGoal.deleteMany({ user: userId, workspace: workspaceId }),
  ]);
}
```

---

## 11. Resumen de Utils a Implementar

### `src/lib/modules/personalfinance/calculators.ts`
- `calculateHousingAffordability()`
- `calculateVehicleAffordability()`
- `calculateEmergencyFundCoverage()`
- `analyzeBudgetRule()`
- `formatCurrency()`
- `calculateGoalProgress()`
- `calculateSuggestedContribution()`

### `src/lib/modules/personalfinance/quota.ts`
- `checkQuota(workspaceId)`
- `consumeQuota(workspaceId, moduleKey, count = 1)`

### `src/lib/modules/personalfinance/index.ts`
- Exports combinados

---

## 12. Checklist Pre-Implementación

- [ ] Module key: 'personalfinance'
- [ ] Quota default: 200/mes
- [ ] Index compuesto: [workspace, user] en todos los schemas
- [ ] Validación 100% en BudgetRule
- [ ] billingCycleDay configurable (default 1)
- [ ] currency por usuario (COP/USD)
- [ ] Eliminación en cascada al borrar usuario
- [ ] Admin nunca ve datos de otros usuarios
- [ ] TransferCheck NO se toca
