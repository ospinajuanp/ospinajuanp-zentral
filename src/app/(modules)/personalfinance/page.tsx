'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToastContext } from '@/contexts/toast-context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type Tab = 'principal' | 'ingresos' | 'egresos';
type IncomeType = 'recurrent' | 'occasional';
type ExpenseType = 'obligatory' | 'savings_investment' | 'discretionary';

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
      setQuotaVersion((v) => v + 1);
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
      setQuotaVersion((v) => v + 1);
    } catch {
      toast.error('Error al cargar gastos');
    } finally {
      setLoadingExpenses(false);
    }
  }, [selectedMonth, selectedYear, toast]);

  const prevTabRef = useRef<Tab | null>(null);
  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    if (activeTab === 'principal') {
      fetch('/api/modules/personalfinance/incomes')
        .then(() => setQuotaVersion((v) => v + 1))
        .catch(() => {});
    }
    if (activeTab === 'ingresos') fetchIncomes();
    if (activeTab === 'egresos') fetchExpenses();
  }, [activeTab, fetchIncomes, fetchExpenses]);

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
        {(['principal', 'ingresos', 'egresos'] as Tab[]).map((tab) => (
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
            onQuotaChange={() => setQuotaVersion((v) => v + 1)}
            totalExpenses={totalExpenses}
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
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const availableMonths = selectedYear === currentYear
    ? MONTHS.filter((m) => m.value <= currentMonth)
    : MONTHS;

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

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-white">Fondo de Emergencia</h3>
        <p className="mt-2 text-sm text-slate-400">
          Configura tu fondo de emergencia para ver la cobertura en meses.
        </p>
      </div>
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
  onQuotaChange,
  totalExpenses,
}: {
  expenses: Expense[];
  loading: boolean;
  formatCurrency: (n: number) => string;
  onRefresh: () => void;
  onQuotaChange: () => void;
  totalExpenses: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ExpenseType>('obligatory');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToastContext();

  const categories = EXPENSE_CATEGORIES[type];

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
