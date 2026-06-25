'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToastContext } from '@/contexts/toast-context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type Tab = 'principal' | 'ingresos' | 'egresos' | 'deudas';
type IncomeType = 'recurrent' | 'occasional';
type ExpenseType = 'obligatory' | 'savings_investment' | 'discretionary';
type DebtType = 'credit_card' | 'personal_loan' | 'vehicle_loan' | 'mortgage' | 'microcredit' | 'family_loan' | 'other';
type DebtStatus = 'active' | 'paid' | 'restructured';

interface Summary {
  currency: 'COP' | 'USD';
  billingCycleDay: number;
}

interface Income {
  _id: string;
  type: IncomeType;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
}

interface Expense {
  _id: string;
  type: ExpenseType;
  category: string;
  amount: number;
  currency: string;
  isRecurrent: boolean;
  recurringPeriod?: string;
  description?: string;
  date: string;
  emergencyFundTarget?: number;
  monthsToEmergencyFund?: number;
}

interface Debt {
  _id: string;
  debtType: DebtType;
  creditor: string;
  originalAmount: number;
  currentBalance: number;
  currency: string;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  expectedEndDate?: string;
  status: DebtStatus;
  notes?: string;
}

const INCOME_CATEGORIES = {
  recurrent: ['Salario', 'Pensión', 'Arriendo', 'Honorarios', 'Inversiones/Fondos'],
  occasional: ['Bonificación', 'Prima', 'Freelance', 'Venta de activos', 'Herencia/Regalo', 'Reembolso', 'Otros'],
};

const EXPENSE_CATEGORIES = {
  obligatory: ['Arriendo/Hipoteca', 'Servicios', 'Alimentación/Hogar', 'Transporte', 'Salud/Seguros', 'Educación', 'Pago de deudas', 'Suscripciones'],
  savings_investment: ['Ahorro emergencia', 'Aportaciones a fondos', 'Inversiones', 'CDT', 'Cesantías', 'Aporte a metas'],
  discretionary: ['Entretenimiento', 'Restaurantes', 'Viajes', 'Compras personales', 'Hobbies', 'Otros'],
};

const DEBT_TYPES: Record<DebtType, string> = {
  credit_card: 'Tarjeta de crédito',
  personal_loan: 'Préstamo de consumo',
  vehicle_loan: 'Préstamo vehicular',
  mortgage: 'Préstamo hipotecario',
  microcredit: 'Microcrédito',
  family_loan: 'Deuda con familiar/amigo',
  other: 'Otro',
};

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export default function PersonalFinanceDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('principal');
  const [quota, setQuota] = useState<{ used: number; total: number; remaining: number } | null>(null);
  const [quotaVersion, setQuotaVersion] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingIncomes, setLoadingIncomes] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtSummary, setDebtSummary] = useState<{ totalBalance: number; totalMonthlyPayment: number } | null>(null);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [emergencyFundData, setEmergencyFundData] = useState<{ savedAmount: number; monthsCompleted: number } | null>(null);

  const toast = useToastContext();

  useEffect(() => {
    fetch('/api/modules/personalfinance')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setQuota(data);
      })
      .catch(() => {});
  }, [quotaVersion]);

  useEffect(() => {
    fetch('/api/modules/personalfinance/years')
      .then((res) => res.json())
      .then((data) => {
        if (data.years) setAvailableYears(data.years);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/modules/personalfinance/summary')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setSummary(data);
      })
      .catch(() => {});
  }, []);

  const fetchIncomes = useCallback(async () => {
    setLoadingIncomes(true);
    try {
      const res = await fetch(
        `/api/modules/personalfinance/incomes?year=${selectedYear}&month=${selectedMonth}`
      );
      const data = await res.json();
      setIncomes(data.items || []);
    } catch {
      toast.error('Error al cargar ingresos');
    } finally {
      setLoadingIncomes(false);
    }
  }, [selectedMonth, selectedYear, toast]);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const res = await fetch(
        `/api/modules/personalfinance/expenses?year=${selectedYear}&month=${selectedMonth}`
      );
      const data = await res.json();
      setExpenses(data.items || []);
    } catch {
      toast.error('Error al cargar gastos');
    } finally {
      setLoadingExpenses(false);
    }
  }, [selectedMonth, selectedYear, toast]);

  const fetchDebts = useCallback(async () => {
    setLoadingDebts(true);
    try {
      const res = await fetch('/api/modules/personalfinance/debts?status=active');
      const data = await res.json();
      setDebts(data.items || []);
      setDebtSummary(data.summary || { totalBalance: 0, totalMonthlyPayment: 0 });
    } catch {
      toast.error('Error al cargar deudas');
    } finally {
      setLoadingDebts(false);
    }
  }, [toast]);

  const fetchEmergencyFund = useCallback(async () => {
    try {
      const res = await fetch('/api/modules/personalfinance/emergency-fund');
      const data = await res.json();
      if (data.savedAmount !== undefined) {
        setEmergencyFundData(data);
      }
    } catch {
      // silent fail
    }
  }, []);

  const prevTabRef = useRef<Tab | null>(null);

  useEffect(() => {
    prevTabRef.current = activeTab;
    if (activeTab === 'principal') {
      Promise.all([
        fetch(`/api/modules/personalfinance/incomes?year=${selectedYear}&month=${selectedMonth}`),
        fetch(`/api/modules/personalfinance/expenses?year=${selectedYear}&month=${selectedMonth}`),
        fetch('/api/modules/personalfinance/debts?status=active'),
      ])
        .then(([incomesRes, expensesRes, debtsRes]) => Promise.all([incomesRes.json(), expensesRes.json(), debtsRes.json()]))
        .then(([incomesData, expensesData, debtsData]) => {
          setIncomes(incomesData.items || []);
          setExpenses(expensesData.items || []);
          setDebtSummary(debtsData.summary || { totalBalance: 0, totalMonthlyPayment: 0 });
        })
        .catch(() => {});
    }
    if (activeTab === 'ingresos') fetchIncomes();
    if (activeTab === 'egresos') fetchExpenses();
    if (activeTab === 'deudas') fetchDebts();
  }, [activeTab, selectedMonth, selectedYear]);

  const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncomes - totalExpenses;

  const formatCurrency = (amount: number) => {
    if (!summary) return amount.toLocaleString('es-CO');
    return new Intl.NumberFormat(summary.currency === 'USD' ? 'en-US' : 'es-CO', {
      style: 'currency',
      currency: summary.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Finanzas Personales</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona tus ingresos, gastos y metas de ahorro
          </p>
        </div>
        {summary && (
          <select
            value={summary.currency}
            onChange={async (e) => {
              try {
                await fetch('/api/modules/personalfinance/summary', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currency: e.target.value }),
                });
                setSummary({ ...summary, currency: e.target.value as 'COP' | 'USD' });
                toast.success('Moneda actualizada');
                } catch {
                  toast.error('Error al actualizar moneda');
                }
              }}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          )}
      </div>

      {quota && (
        <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-sm font-medium text-slate-300">Cuota mensual</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {quota.used.toLocaleString()} / {quota.total.toLocaleString()}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-indigo-600 transition-all"
              style={{ width: `${Math.min(100, (quota.used / quota.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-2 rounded-lg bg-slate-900 p-1">
        {(['principal', 'ingresos', 'egresos', 'deudas'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'principal' && 'Principal'}
            {tab === 'ingresos' && 'Ingresos'}
            {tab === 'egresos' && 'Egresos'}
            {tab === 'deudas' && 'Deudas'}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'principal' && (
          <PrincipalTab
            summary={summary}
            totalIncomes={totalIncomes}
            totalExpenses={totalExpenses}
            netBalance={netBalance}
            formatCurrency={formatCurrency}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={(m) => setSelectedMonth(m)}
            onYearChange={(y) => setSelectedYear(y)}
            availableYears={availableYears}
            debtSummary={debtSummary}
            expenses={expenses}
            emergencyFundData={emergencyFundData}
            fetchEmergencyFund={fetchEmergencyFund}
          />
        )}
        {activeTab === 'ingresos' && (
          <IngresosTab
            incomes={incomes}
            loading={loadingIncomes}
            formatCurrency={formatCurrency}
            onRefresh={fetchIncomes}
            onQuotaChange={() => setQuotaVersion((v) => v + 1)}
            totalIncomes={totalIncomes}
          />
        )}
        {activeTab === 'egresos' && (
          <EgresosTab
            expenses={expenses}
            loading={loadingExpenses}
            formatCurrency={formatCurrency}
            onRefresh={fetchExpenses}
            onRefreshIncomes={fetchIncomes}
            onQuotaChange={() => setQuotaVersion((v) => v + 1)}
            totalExpenses={totalExpenses}
            totalIncomes={totalIncomes}
          />
        )}
        {activeTab === 'deudas' && (
          <DeudasTab
            debts={debts}
            summary={debtSummary}
            loading={loadingDebts}
            formatCurrency={formatCurrency}
            onRefresh={fetchDebts}
            onRefreshExpenses={fetchExpenses}
            onQuotaChange={() => setQuotaVersion((v) => v + 1)}
          />
        )}
      </div>
    </div>
  );
}

function PrincipalTab({
  summary,
  totalIncomes,
  totalExpenses,
  netBalance,
  formatCurrency,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  availableYears,
  debtSummary,
  expenses,
  emergencyFundData,
  fetchEmergencyFund,
}: {
  summary: Summary | null;
  totalIncomes: number;
  totalExpenses: number;
  netBalance: number;
  formatCurrency: (n: number) => string;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  availableYears: number[];
  debtSummary: { totalBalance: number; totalMonthlyPayment: number } | null;
  expenses: Expense[];
  emergencyFundData: { savedAmount: number; monthsCompleted: number } | null;
  fetchEmergencyFund: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const availableMonths = selectedYear === currentYear
    ? MONTHS.filter((m) => m.value <= currentMonth)
    : MONTHS;

  useEffect(() => {
    fetchEmergencyFund();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          {availableMonths.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm font-medium text-slate-400">Ingresos</p>
          <p className="mt-2 text-2xl font-bold text-green-400">{formatCurrency(totalIncomes)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm font-medium text-slate-400">Gastos</p>
          <p className="mt-2 text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm font-medium text-slate-400">Saldo Neto</p>
          <p className={`mt-2 text-2xl font-bold ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {debtSummary && (
        <div className="rounded-lg border border-orange-900 bg-slate-900 p-5">
          <h3 className="text-lg font-semibold text-white">Deudas Activas</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total adeudado:</span>
              <span className="text-sm font-medium text-red-400">{formatCurrency(debtSummary.totalBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Cuota mensual:</span>
              <span className="text-sm font-medium text-orange-400">{formatCurrency(debtSummary.totalMonthlyPayment)}</span>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const emergencyFundExpense = expenses.find(
          (e) => e.category === 'Ahorro emergencia'
        );
        if (!emergencyFundExpense) return null;
        const target = emergencyFundExpense.emergencyFundTarget || 0;
        const totalMonths = emergencyFundExpense.monthsToEmergencyFund || 1;
        const monthlyAmount = emergencyFundExpense.amount;
        const savedAmount = emergencyFundData?.savedAmount || 0;
        const monthsCompleted = emergencyFundData?.monthsCompleted || 1;
        const progress = target > 0 ? savedAmount / target : 0;
        return (
          <div className="rounded-lg border border-green-900 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-white">Fondo de Emergencia</h3>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Meta:</span>
                <span className="text-sm font-medium text-white">{formatCurrency(target)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Ahorro mensual:</span>
                <span className="text-sm font-medium text-green-400">{formatCurrency(monthlyAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Progreso:</span>
                <span className="text-sm font-medium text-white">{monthsCompleted}/{totalMonths} meses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Meses guardando:</span>
                <span className="text-sm font-medium text-orange-400">{monthsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Acumulado:</span>
                <span className="text-sm font-medium text-green-400">{formatCurrency(savedAmount)}</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progreso</span>
                  <span className="text-green-400">{Math.round(progress * 100)}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${Math.min(progress * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function IngresosTab({
  incomes,
  loading,
  formatCurrency,
  onRefresh,
  onQuotaChange,
  totalIncomes,
}: {
  incomes: Income[];
  loading: boolean;
  formatCurrency: (n: number) => string;
  onRefresh: () => void;
  onQuotaChange: () => void;
  totalIncomes: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<IncomeType>('recurrent');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToastContext();

  const categories = INCOME_CATEGORIES[type];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !amount) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/modules/personalfinance/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          category,
          amount: parseFloat(amount),
          date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          toast.error('Cuota mensual excedida');
          return;
        }
        toast.error(data.error || 'Error al crear');
        return;
      }

      toast.success('Ingreso agregado');
      setShowForm(false);
      setCategory('');
      setAmount('');
      setDescription('');
      onRefresh();
      onQuotaChange();
    } catch {
      toast.error('Error al crear ingreso');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/modules/personalfinance/incomes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        if (res.status === 429) {
          toast.error('Cuota mensual excedida');
        } else {
          toast.error('Error al eliminar');
        }
        return;
      }
      toast.success('Ingreso eliminado');
      onRefresh();
      onQuotaChange();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : '+ Agregar Ingreso'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-400">Tipo</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as IncomeType); setCategory(''); }}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                <option value="recurrent">Recurrente</option>
                <option value="occasional">Ocasional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400">Monto</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Descripción (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !category || !amount}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Categoría</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Monto</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No hay ingresos registrados este mes
                    </td>
                  </tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income._id}>
                      <td className="px-4 py-3 text-sm text-white">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          income.type === 'recurrent'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-blue-900 text-blue-300'
                        }`}>
                          {income.type === 'recurrent' ? 'Recurrente' : 'Ocasional'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{income.category}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-green-400">
                        {formatCurrency(income.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteId(income._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {incomes.length > 0 && (
                <tfoot className="bg-slate-800">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-medium text-slate-400">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-green-400">
                      {formatCurrency(totalIncomes)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar ingreso"
        message="¿Estás seguro de que deseas eliminar este ingreso?"
        itemName={incomes.find((i) => i._id === deleteId)?.category || ''}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

function EgresosTab({
  expenses,
  loading,
  formatCurrency,
  onRefresh,
  onRefreshIncomes,
  onQuotaChange,
  totalExpenses,
  totalIncomes,
}: {
  expenses: Expense[];
  loading: boolean;
  formatCurrency: (n: number) => string;
  onRefresh: () => void;
  onRefreshIncomes: () => void;
  onQuotaChange: () => void;
  totalExpenses: number;
  totalIncomes: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ExpenseType>('obligatory');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [emergencyFundTarget, setEmergencyFundTarget] = useState('');
  const [monthsToEmergencyFund, setMonthsToEmergencyFund] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToastContext();

  const categories = EXPENSE_CATEGORIES[type];
  const isEmergencyFund = category === 'Ahorro emergencia';

  const calculatedEmergencyFundTarget = totalExpenses * 6;

  function calculateMonthsForEmergencyFund(target: number, income: number) {
    if (!income || income <= 0) return 12;
    const maxMonthlyAmount = income * 0.10;
    let months = 1;
    while (months < 120 && target / months > maxMonthlyAmount) {
      months++;
    }
    return months;
  }

  useEffect(() => {
    if (isEmergencyFund && totalIncomes > 0 && !monthsToEmergencyFund) {
      const target = calculatedEmergencyFundTarget;
      const months = calculateMonthsForEmergencyFund(target, totalIncomes);
      setEmergencyFundTarget(target.toString());
      setMonthsToEmergencyFund(months.toString());
      setAmount((target / months).toFixed(0));
    }
  }, [isEmergencyFund, totalIncomes]);

  useEffect(() => {
    if (isEmergencyFund && emergencyFundTarget && monthsToEmergencyFund) {
      const target = parseFloat(emergencyFundTarget);
      const months = parseInt(monthsToEmergencyFund);
      if (target > 0 && months > 0) {
        setAmount((target / months).toFixed(0));
      }
    }
  }, [isEmergencyFund, emergencyFundTarget, monthsToEmergencyFund]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !amount) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/modules/personalfinance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          category,
          amount: parseFloat(amount),
          isRecurrent,
          date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
          description,
          emergencyFundTarget: isEmergencyFund && emergencyFundTarget ? parseFloat(emergencyFundTarget) : undefined,
          monthsToEmergencyFund: isEmergencyFund && monthsToEmergencyFund ? parseInt(monthsToEmergencyFund) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          toast.error('Cuota mensual excedida');
          return;
        }
        toast.error(data.error || 'Error al crear');
        return;
      }

      toast.success('Gasto agregado');
      setShowForm(false);
      setCategory('');
      setAmount('');
      setDescription('');
      setEmergencyFundTarget('');
      setMonthsToEmergencyFund('');
      onRefresh();
      onQuotaChange();
    } catch {
      toast.error('Error al crear gasto');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/modules/personalfinance/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        if (res.status === 429) {
          toast.error('Cuota mensual excedida');
        } else {
          toast.error('Error al eliminar');
        }
        return;
      }
      toast.success('Gasto eliminado');
      onRefresh();
      onQuotaChange();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : '+ Agregar Gasto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-400">Tipo</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as ExpenseType); setCategory(''); }}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                <option value="obligatory">Obligatorio</option>
                <option value="savings_investment">Ahorro/Inversión</option>
                <option value="discretionary">Discrecional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400">Categoría</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value === 'Ahorro emergencia') {
                    const target = calculatedEmergencyFundTarget;
                    setEmergencyFundTarget(target.toString());
                    if (totalIncomes > 0) {
                      const months = calculateMonthsForEmergencyFund(target, totalIncomes);
                      setMonthsToEmergencyFund(months.toString());
                      setAmount((target / months).toFixed(0));
                    } else {
                      setMonthsToEmergencyFund('');
                      setAmount('');
                      onRefreshIncomes();
                    }
                    setIsRecurrent(true);
                  } else {
                    setEmergencyFundTarget('');
                    setMonthsToEmergencyFund('');
                    setAmount('');
                    setIsRecurrent(false);
                  }
                }}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {isEmergencyFund && (
              <>
                <div>
                  <label className="block text-sm text-slate-400">Meta Fondo ({formatCurrency(calculatedEmergencyFundTarget)})</label>
                  <input
                    type="number"
                    value={emergencyFundTarget}
                    onChange={(e) => setEmergencyFundTarget(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder={`${calculatedEmergencyFundTarget}`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Meses para meta</label>
                  <input
                    type="number"
                    value={monthsToEmergencyFund}
                    onChange={(e) => setMonthsToEmergencyFund(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="12"
                    min="1"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-slate-400">
                {isEmergencyFund ? 'Monto Mensual (calculado)' : 'Monto'}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder={isEmergencyFund && emergencyFundTarget && monthsToEmergencyFund
                  ? formatCurrency(parseFloat(emergencyFundTarget) / parseInt(monthsToEmergencyFund))
                  : '0'}
              />
            </div>
            {!isEmergencyFund && (
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isRecurrent"
                  checked={isRecurrent}
                  onChange={(e) => setIsRecurrent(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <label htmlFor="isRecurrent" className="text-sm text-slate-400">Recurrente</label>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-400">Descripción (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !category || !amount}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Categoría</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Monto</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Recurrente</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay gastos registrados este mes
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense._id}>
                      <td className="px-4 py-3 text-sm text-white">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          expense.type === 'obligatory'
                            ? 'bg-red-900 text-red-300'
                            : expense.type === 'savings_investment'
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-purple-900 text-purple-300'
                        }`}>
                          {expense.type === 'obligatory' ? 'Obligatorio' : expense.type === 'savings_investment' ? 'Ahorro' : 'Discrecional'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{expense.category}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-red-400">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-400">
                        {expense.isRecurrent ? 'Sí' : 'No'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteId(expense._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {expenses.length > 0 && (
                <tfoot className="bg-slate-800">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-medium text-slate-400">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-red-400">
                      {formatCurrency(totalExpenses)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar gasto"
        message="¿Estás seguro de que deseas eliminar este gasto?"
        itemName={expenses.find((e) => e._id === deleteId)?.category || ''}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

function DeudasTab({
  debts,
  summary,
  loading,
  formatCurrency,
  onRefresh,
  onRefreshExpenses,
  onQuotaChange,
}: {
  debts: Debt[];
  summary: { totalBalance: number; totalMonthlyPayment: number } | null;
  loading: boolean;
  formatCurrency: (n: number) => string;
  onRefresh: () => void;
  onRefreshExpenses: () => void;
  onQuotaChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [debtType, setDebtType] = useState<DebtType>('credit_card');
  const [creditor, setCreditor] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const toast = useToastContext();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditor || !originalAmount || !currentBalance || !interestRate || !monthlyPayment || !startDate || !currency) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/modules/personalfinance/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtType,
          creditor,
          originalAmount: parseFloat(originalAmount),
          currentBalance: parseFloat(currentBalance),
          currency,
          interestRate: parseFloat(interestRate),
          monthlyPayment: parseFloat(monthlyPayment),
          startDate,
          expectedEndDate: expectedEndDate || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          toast.error('Cuota mensual excedida');
          return;
        }
        toast.error(data.error || 'Error al crear');
        return;
      }

      toast.success('Deuda registrada');
      setShowForm(false);
      setCreditor('');
      setOriginalAmount('');
      setCurrentBalance('');
      setInterestRate('');
      setMonthlyPayment('');
      setStartDate('');
      setExpectedEndDate('');
      setNotes('');
      onRefresh();
      onRefreshExpenses();
      onQuotaChange();
    } catch {
      toast.error('Error al crear deuda');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/modules/personalfinance/debts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        if (res.status === 429) {
          toast.error('Cuota mensual excedida');
        } else {
          toast.error('Error al eliminar');
        }
        return;
      }
      toast.success('Deuda eliminada');
      onRefresh();
      onRefreshExpenses();
      onQuotaChange();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentDebtId || !paymentAmount) return;

    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/modules/personalfinance/debts/${paymentDebtId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(paymentAmount) }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          toast.error('Cuota mensual excedida');
          return;
        }
        toast.error(data.error || 'Error al registrar pago');
        return;
      }

      const debt = await res.json();
      toast.success(debt.status === 'paid' ? '¡Deuda pagada completamente!' : 'Pago registrado');
      setPaymentDebtId(null);
      setPaymentAmount('');
      onRefresh();
      onRefreshExpenses();
      onQuotaChange();
    } catch {
      toast.error('Error al registrar pago');
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-400">
          {summary && (
            <span>Total adeudado: <span className="text-red-400 font-medium">{formatCurrency(summary.totalBalance)}</span></span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : '+ Agregar Deuda'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-400">Tipo de deuda</label>
              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value as DebtType)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                {Object.entries(DEBT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400">Acreedor</label>
              <input
                type="text"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="Ej: Banco de Bogotá"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Monto original</label>
              <input
                type="number"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Saldo pendiente</label>
              <input
                type="number"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'COP' | 'USD')}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400">Tasa de interés mensual (%)</label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="Ej: 2.5"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Cuota mensual</label>
              <input
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Fecha de inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Fecha esperada de terminación (opcional)</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-400">Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !creditor || !originalAmount || !currentBalance || !interestRate || !monthlyPayment || !startDate || !currency}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Acreedor</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Saldo</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Cuota</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {debts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay deudas registradas
                    </td>
                  </tr>
                ) : (
                  debts.map((debt) => (
                    <tr key={debt._id}>
                      <td className="px-4 py-3 text-sm text-white">
                        <span className="rounded-full px-2 py-1 text-xs bg-orange-900 text-orange-300">
                          {DEBT_TYPES[debt.debtType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{debt.creditor}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-red-400">
                        {formatCurrency(debt.currentBalance)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-400">
                        {formatCurrency(debt.monthlyPayment)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setPaymentDebtId(debt._id)}
                          className="text-green-400 hover:text-green-300 mr-2"
                        >
                          💰
                        </button>
                        <button
                          onClick={() => setDeleteId(debt._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {paymentDebtId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-lg font-medium text-white mb-4">Registrar pago</h3>
                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400">Monto del pago</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setPaymentDebtId(null); setPaymentAmount(''); }}
                      className="flex-1 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={paymentLoading || !paymentAmount}
                      className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {paymentLoading ? 'Guardando...' : 'Registrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar deuda"
        message="¿Estás seguro de que deseas eliminar esta deuda?"
        itemName={debts.find((d) => d._id === deleteId)?.creditor || ''}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
