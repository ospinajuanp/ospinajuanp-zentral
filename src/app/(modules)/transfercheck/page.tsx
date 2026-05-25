'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToastContext } from '@/contexts/toast-context';

const DEBUG = false;

type Tab = 'upload' | 'sync' | 'logs' | 'consolidated' | 'config';

interface TransferLog {
  _id: string;
  photoData: { monto: number; referencia: string; fecha: string };
  emailData: { from: string; subject: string; date: string; snippet: string } | null;
  status: 'pending_email' | 'matched' | 'manual_error';
  retryCount: number;
  nextRetryAt: string | null;
  createdAt: string;
  matchedAt: string | null;
  userId: { name: string; email: string };
  resolvedBy: { name: string; email: string } | null;
  manualData: { monto: number; referencia: string; fecha: string } | null;
}

interface DebugEmail {
  messageId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  bodyPreview: string;
  matchedAmount: boolean;
  matchedReference: boolean;
  matchedReferenceInBody: boolean;
}

interface DebugResult {
  success: boolean;
  searchQuery: string;
  amountVariations: string[];
  referenceVariations: string[];
  emails: DebugEmail[];
  error?: string;
}

export default function TransferCheckDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [role, setRole] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ used: number; total: number; remaining: number; unlimited: boolean } | null>(null);
  const [quotaVersion, setQuotaVersion] = useState(0);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => setRole(data.role ?? null))
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    fetch('/api/modules/transfercheck/quota')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setQuota(data);
      })
      .catch(() => {});
  }, [quotaVersion]);

  const isAdmin = role === 'admin' || role === 'superadmin';
  const tabs: Tab[] = isAdmin
    ? ['upload', 'sync', 'logs', 'consolidated', 'config']
    : ['upload', 'sync', 'logs'];

  if (role === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">TransferCheck</h1>
          <p className="mt-1 text-sm text-slate-400">
            Verificación y validación de transferencias bancarias
          </p>
        </div>
      </div>

      {quota && (
        <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-sm font-medium text-slate-300">Cuota mensual</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {quota.unlimited
              ? 'Ilimitada'
              : `${quota.used.toLocaleString()} / ${quota.total.toLocaleString()}`}
          </p>
          {!quota.unlimited && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.min(100, (quota.used / quota.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex gap-1 rounded-lg bg-slate-900 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'upload' && 'Subir comprobante'}
            {tab === 'sync' && 'Verificar pagos'}
            {tab === 'logs' && 'Historial'}
            {tab === 'consolidated' && 'Consolidado'}
            {tab === 'config' && 'Configuración'}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'upload' && <UploadTab onProcessed={() => setQuotaVersion((v) => v + 1)} />}
        {activeTab === 'sync' && <SyncTab onProcessed={() => setQuotaVersion((v) => v + 1)} />}
        {activeTab === 'logs' && <LogsTab isAdmin={isAdmin} />}
        {activeTab === 'consolidated' && <ConsolidatedTab />}
        {activeTab === 'config' && <ConfigTab />}
      </div>
    </div>
  );
}

function UploadTab({ onProcessed }: { onProcessed: () => void }) {
  const toast = useToastContext();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<TransferLog[]>([]);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [gmailMissing, setGmailMissing] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  // Auto-clear each result after 20 seconds
  useEffect(() => {
    if (results.length === 0) return;
    const timers = results.map((r) =>
      setTimeout(() => {
        setResults((prev) => prev.filter((p) => p._id !== r._id));
      }, 20000)
    );
    return () => timers.forEach(clearTimeout);
  }, [results]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setGmailMissing(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/modules/transfercheck/process-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.gmailRequired) {
          setGmailMissing(true);
          toast.info('Conecta tu correo de Gmail antes de procesar comprobantes.');
          return;
        }
        toast.error(data.error || 'Error al procesar');
        return;
      }

      setResults((prev) => [data.log, ...prev]);
      setFile(null);
      setInputKey((k) => k + 1);
      setDebugResult(null);

      const logStatus = data.log?.status as string;
      if (logStatus === 'matched') {
        toast.success('Comprobante conciliado exitosamente.');
      } else if (logStatus === 'pending_email') {
        toast.info('Comprobante procesado. Pendiente de conciliacion.');
      } else if (logStatus === 'manual_error') {
        toast.error('Comprobante procesado. Sin coincidencia — ya no se procesara mas.');
      } else {
        toast.info('Comprobante procesado.');
      }
      onProcessed();
    } catch {
      toast.error('No se pudo procesar. Revisa tu conexión a internet.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {gmailMissing && (
        <div className="mb-6 rounded-md border border-amber-800 bg-amber-950/30 p-6 text-center">
          <p className="text-sm font-medium text-amber-400">
            No tienes tu correo conectado
          </p>
          <p className="mt-1 text-xs text-amber-500/80">
            Para procesar comprobantes necesitas conectar tu cuenta de Gmail.
          </p>
          <button
            onClick={() => window.location.href = '/api/auth/gmail/connect?redirect=/transfercheck'}
            className="mt-4 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Conectar Gmail
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-md border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <div className="mx-auto max-w-md">
          <label className="block text-sm font-medium text-slate-300">
            Comprobante de transferencia
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Subi una foto del comprobante. El sistema leera automaticamente el monto y la referencia.
          </p>

          <div className="mt-4">
            <input
              key={inputKey}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded file:border-0 file:bg-indigo-600 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700"
            />
          </div>

          {file && (
            <p className="mt-2 text-xs text-slate-400">
              {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </span>
            ) : (
              'Procesar comprobante'
            )}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          {results.map((r) => (
            <ResultCard
              key={r._id}
              result={r}
              debugResult={debugResult}
              debugLoading={debugLoading}
              onDebug={async (logId: string) => {
                setDebugLoading(true);
                try {
                  const res = await fetch('/api/modules/transfercheck/debug-search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ logId }),
                  });
                  const data = await res.json();
                  setDebugResult(data);
                } catch {
                  setDebugResult({ success: false, searchQuery: '', amountVariations: [], referenceVariations: [], emails: [], error: 'Error de conexion' });
                } finally {
                  setDebugLoading(false);
                }
              }}
              onDismiss={() => setResults((prev) => prev.filter((p) => p._id !== r._id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  result,
  debugResult,
  debugLoading,
  onDebug,
  onDismiss,
}: {
  result: TransferLog;
  debugResult: DebugResult | null;
  debugLoading: boolean;
  onDebug: (logId: string) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white sm:text-base">Resultado</h3>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          aria-label="Cerrar resultado"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <span className="text-xs text-slate-500">Monto</span>
          <p className="text-lg font-bold text-white sm:text-2xl">
            ${result.photoData.monto.toLocaleString('es-CO')}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Referencia</span>
          <p className="truncate text-lg font-bold text-white sm:text-2xl">{result.photoData.referencia}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Estado</span>
          <p className={`text-lg font-bold sm:text-2xl ${
            result.status === 'matched' ? 'text-emerald-500' :
            result.status === 'manual_error' ? 'text-rose-500' :
            'text-amber-400'
          }`}>
            {result.status === 'matched' ? 'Conciliado' :
             result.status === 'manual_error' ? 'Sin coincidencia' :
             'Pendiente'}
          </p>
        </div>
      </div>

      {result.emailData && (
        <div className="mt-3 rounded-md border border-emerald-800 bg-emerald-500/10 px-3 py-2 sm:px-4 sm:py-3">
          <p className="text-xs text-emerald-400 sm:text-sm">
            Pago confirmado en tu correo: {result.emailData.subject}
          </p>
        </div>
      )}

      {result.status === 'manual_error' && (
        <div className="mt-3 rounded-md border border-amber-700 bg-amber-500/10 px-3 py-2 sm:px-4 sm:py-3">
          <p className="text-xs text-amber-400 sm:text-sm">
            No encontramos este pago en tu correo despues de varios intentos. Revisalo en el Historial.
          </p>
        </div>
      )}

      {DEBUG && (
        <div className="mt-3">
          <DebugPanel
            logId={result._id}
            debugResult={debugResult}
            debugLoading={debugLoading}
            onDebug={() => onDebug(result._id)}
          />
        </div>
      )}
    </div>
  );
}

interface SyncItemResult {
  logId: string;
  referencia: string;
  monto: number;
  newStatus: 'matched' | 'pending_email' | 'manual_error';
  error?: string;
}

function SyncTab({ onProcessed }: { onProcessed: () => void }) {
  const toast = useToastContext();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ processed: number; results: SyncItemResult[] } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/modules/transfercheck/sync-email', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Error al verificar pagos');
        return;
      }

      setSyncResult({ processed: data.processed, results: data.results });
      if (data.processed > 0) {
        onProcessed();
        const matched = data.results.filter((r: SyncItemResult) => r.newStatus === 'matched').length;
        const pending = data.results.filter((r: SyncItemResult) => r.newStatus === 'pending_email').length;
        const errors = data.results.filter((r: SyncItemResult) => r.newStatus === 'manual_error').length;
        const parts: string[] = [];
        if (matched > 0) parts.push(`${matched} conciliado${matched !== 1 ? 's' : ''}`);
        if (pending > 0) parts.push(`${pending} pendiente${pending !== 1 ? 's' : ''}`);
        if (errors > 0) parts.push(`${errors} sin coincidencia`);
        if (errors > 0) {
          toast.error(`${data.processed} verificado${data.processed !== 1 ? 's' : ''}: ${parts.join(', ')}.`);
        } else if (parts.length === 1 && matched === data.processed) {
          toast.success(`${data.processed} comprobante${data.processed !== 1 ? 's' : ''} conciliado${data.processed !== 1 ? 's' : ''}.`);
        } else {
          toast.info(`${data.processed} verificado${data.processed !== 1 ? 's' : ''}: ${parts.join(', ')}.`);
        }
      } else {
        toast.info('No se encontraron comprobantes pendientes.');
      }
    } catch {
      toast.error('No se pudo conectar. Revisa tu conexión a internet.');
    } finally {
      setSyncing(false);
    }
  }

  const matchedCount = syncResult?.results.filter((r) => r.newStatus === 'matched').length ?? 0;
  const pendingCount = syncResult?.results.filter((r) => r.newStatus === 'pending_email').length ?? 0;
  const errorCount = syncResult?.results.filter((r) => r.newStatus === 'manual_error').length ?? 0;

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-8">
      <div className="mx-auto max-w-xl">
        <h3 className="text-lg font-semibold text-white">Verificar pagos</h3>
        <p className="mt-2 text-sm text-slate-400">
          Busca en tu correo de Gmail las confirmaciones de los comprobantes pendientes y los concilia cuando encuentra coincidencia.
        </p>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {syncing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Verificando...
            </span>
          ) : (
            'Verificar pagos ahora'
          )}
        </button>

        {syncResult !== null && syncResult.results.length === 0 && (
          <div className="mt-6 rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-center">
            <p className="text-sm text-slate-400">No hay comprobantes pendientes para verificar.</p>
          </div>
        )}

        {syncResult !== null && syncResult.results.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap gap-3 text-sm">
              {matchedCount > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  {matchedCount} conciliado{matchedCount !== 1 ? 's' : ''}
                </span>
              )}
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                </span>
              )}
              {errorCount > 0 && (
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400">
                  {errorCount} sin coincidencia
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-800 rounded-md border border-slate-800 bg-slate-950">
              {syncResult.results.map((item) => (
                <div key={item.logId} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 truncate">
                      Ref: {item.referencia}
                    </p>
                    <p className="text-xs text-slate-500">
                      ${item.monto.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <span className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.newStatus === 'matched'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : item.newStatus === 'manual_error'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {item.newStatus === 'matched' ? 'Conciliado' :
                     item.newStatus === 'manual_error' ? 'Sin coincidencia' :
                     'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-md border border-slate-800 bg-slate-950 px-5 py-4 text-left">
          <p className="text-sm font-medium text-slate-300">¿Cómo funciona?</p>
          <p className="mt-2 text-xs text-slate-500">
            Cada vez que presionas "Verificar pagos", buscamos en tu correo los comprobantes pendientes. Si encontramos un correo con el mismo monto y referencia, el pago queda conciliado. Si después de 3 intentos no hay coincidencia, queda marcado para que lo revises manualmente.
          </p>
        </div>
      </div>
    </div>
  );
}

function LogsTab({ isAdmin }: { isAdmin: boolean }) {
  const toast = useToastContext();
  const [logs, setLogs] = useState<TransferLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<{ logId: string; monto: string; referencia: string } | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('fechaDesde', dateFrom);
      if (dateTo) params.set('fechaHasta', dateTo);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/modules/transfercheck/logs?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast.error('No se pudo cargar el historial. Reintenta en unos minutos.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function handleManualReconcile() {
    if (!manualForm) return;
    setReconciling(manualForm.logId);
    try {
      const res = await fetch('/api/modules/transfercheck/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logId: manualForm.logId,
          monto: manualForm.monto,
          referencia: manualForm.referencia,
          fecha: new Date().toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        toast.success('Comprobante conciliado manualmente.');
        setManualForm(null);
        fetchLogs();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al conciliar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setReconciling(null);
    }
  }

  const statusLabels: Record<string, string> = {
    pending_email: 'Pendiente',
    matched: 'Conciliado',
    manual_error: 'Error manual',
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'pending_email', 'matched', 'manual_error'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {s === '' ? 'Todos' : statusLabels[s] || s}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-end gap-2 mb-6">
        <div>
          <label htmlFor="log-date-from" className="block text-xs text-slate-500 mb-1">Desde</label>
          <input
            id="log-date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>
        <div>
          <label htmlFor="log-date-to" className="block text-xs text-slate-500 mb-1">Hasta</label>
          <input
            id="log-date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300"
          >
            Limpiar fechas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-md border border-slate-800 bg-slate-900 py-12 text-center">
          <p className="text-sm text-slate-400">Todavía no subiste ningún comprobante.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-500">
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Monto</th>
                  <th className="pb-3 pr-4">Referencia</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3 pr-4">Intentos</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/50">
                    <td className="py-4 pr-4 text-slate-300 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 pr-4 font-medium text-white whitespace-nowrap">
                      ${log.photoData.monto.toLocaleString('es-CO')}
                    </td>
                    <td className="py-4 pr-4 text-slate-300 font-mono text-xs">
                      {log.photoData.referencia}
                    </td>
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        log.status === 'matched'
                          ? isAdmin && log.resolvedBy ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-500'
                          : log.status === 'manual_error'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {statusLabels[log.status]}
                      </span>
                      {isAdmin && log.resolvedBy && (
                        <p className="mt-0.5 text-xs text-slate-500">por {log.resolvedBy.name}</p>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-slate-500">
                      {log.retryCount}
                    </td>
                    <td className="py-4 text-right">
                      {log.status !== 'matched' && (
                        <button
                          onClick={() => setManualForm({ logId: log._id, monto: String(log.photoData.monto), referencia: log.photoData.referencia })}
                          className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Conciliar
                        </button>
                      )}
                      {DEBUG && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/modules/transfercheck/debug-search', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ logId: log._id }),
                            });
                            const data = await res.json();
                            const win = window.open('', '_blank', 'width=900,height=700');
                            if (win) {
                              win.document.write('<pre style="font-size:12px;padding:16px;background:#111;color:#eee">' + JSON.stringify(data, null, 2) + '</pre>');
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="ml-2 rounded-md border border-amber-700 px-2 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10"
                      >
                        Debug
                      </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-4 sm:hidden">
            {logs.map((log) => (
              <div key={log._id} className="rounded-md border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      log.status === 'matched'
                        ? isAdmin && log.resolvedBy ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-500'
                        : log.status === 'manual_error'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {statusLabels[log.status]}
                    </span>
                    {isAdmin && log.resolvedBy && (
                      <span className="ml-2 text-xs text-slate-500">por {log.resolvedBy.name}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleDateString('es-CO')}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Monto</span>
                    <p className="font-medium text-white">${log.photoData.monto.toLocaleString('es-CO')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Referencia</span>
                    <p className="font-mono text-xs text-slate-300">{log.photoData.referencia}</p>
                  </div>
                </div>
                {log.status !== 'matched' && (
                  <button
                    onClick={() => setManualForm({ logId: log._id, monto: String(log.photoData.monto), referencia: log.photoData.referencia })}
                    className="mt-3 w-full rounded-md border border-slate-700 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Conciliar manualmente
                  </button>
                )}
                {DEBUG && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/modules/transfercheck/debug-search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ logId: log._id }),
                      });
                      const data = await res.json();
                      const win = window.open('', '_blank', 'width=900,height=700');
                      if (win) {
                        win.document.write('<pre style="font-size:12px;padding:16px;background:#111;color:#eee">' + JSON.stringify(data, null, 2) + '</pre>');
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="mt-2 w-full rounded-md border border-amber-700 py-2 text-xs text-amber-400 hover:bg-amber-500/10"
                >
                  Debug
                </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Manual reconciliation modal */}
      {manualForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setManualForm(null)}>
          <div
            className="w-full max-w-md rounded-md border border-slate-800 bg-slate-950 p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
            aria-labelledby="reconcile-title"
          >
            <h3 id="reconcile-title" className="text-lg font-semibold text-white">
              Conciliación manual
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Confirmá los datos del comprobante.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400">Monto</label>
                <input
                  type="number"
                  value={manualForm.monto}
                  onChange={(e) => setManualForm({ ...manualForm, monto: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Ej: 150000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Referencia</label>
                <input
                  type="text"
                  value={manualForm.referencia}
                  onChange={(e) => setManualForm({ ...manualForm, referencia: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Ej: REF123456"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Fecha</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setManualForm(null)}
                className="flex-1 rounded-md border border-slate-700 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualReconcile}
                disabled={reconciling !== null}
                className="flex-1 rounded-md bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {reconciling ? 'Conciliando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ConsolidatedStats {
  totalConciliados: number;
  conciliadosAutomaticos: number;
  conciliadosManuales: number;
  totalErrorManual: number;
  montoConciliados: number;
  montoAutomaticos: number;
  montoManuales: number;
  montoErrorManual: number;
}

interface ConsolidatedLog {
  _id: string;
  photoData: { monto: number; referencia: string; fecha: string };
  status: 'pending_email' | 'matched' | 'manual_error';
  retryCount: number;
  createdAt: string;
  userId: { name: string; email: string };
  resolvedBy: { name: string; email: string } | null;
}

function ConsolidatedTab() {
  const toast = useToastContext();
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [stats, setStats] = useState<ConsolidatedStats | null>(null);
  const [logs, setLogs] = useState<ConsolidatedLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('fechaDesde', dateFrom);
      params.set('fechaHasta', dateTo);

      const res = await fetch(`/api/modules/transfercheck/consolidado?${params}`);
      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
        setLogs(data.logs);
      } else {
        toast.error(data.error || 'Error al cargar');
      }
    } catch {
      toast.error('No se pudo cargar el consolidado.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const existing = (window as unknown as Record<string, unknown>).__xlsx;
    if (!existing) {
      import('xlsx').then((module) => {
        (window as unknown as Record<string, unknown>).__xlsx = module;
        generateExcel(module);
      });
      return;
    }
    generateExcel(existing);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function generateExcel(xlsx: any) {
    const summary = [
      ['Resumen', 'Cantidad', 'Monto total'],
      ['Conciliados', stats?.totalConciliados || 0, stats?.montoConciliados || 0],
      ['Automático', stats?.conciliadosAutomaticos || 0, stats?.montoAutomaticos || 0],
      ['Manual', stats?.conciliadosManuales || 0, stats?.montoManuales || 0],
      ['Error manual', stats?.totalErrorManual || 0, stats?.montoErrorManual || 0],
      [],
      ['Fecha', 'Monto', 'Referencia', 'Estado', 'Subido por', 'Conciliado por', 'Intentos'],
    ];

    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleDateString('es-CO'),
      log.photoData.monto,
      log.photoData.referencia,
      log.status === 'matched' ? 'Conciliado' : log.status === 'manual_error' ? 'Error manual' : 'Pendiente',
      log.userId?.name || '-',
      log.resolvedBy?.name || (log.status === 'matched' ? 'Automático' : '-'),
      log.retryCount,
    ]);

    const sheet = xlsx.utils.aoa_to_sheet([...summary, ...rows]);
    const wb = { Sheets: { Consolidado: sheet }, SheetNames: ['Consolidado'] };
    const buf = xlsx.write(wb, { bookType: 'xlsx', type: 'base64' });

    const url = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buf}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `consolidado-${dateFrom}_${dateTo}.xlsx`;
    a.click();
  }

  const statusLabels: Record<string, string> = {
    matched: 'Conciliado',
    manual_error: 'Error manual',
    pending_email: 'Pendiente',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Date filter */}
      <div className="flex flex-wrap items-end gap-2 mb-6">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>
        <button
          onClick={fetchData}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Filtrar
        </button>
      </div>

      {stats && (
        <>
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-md border border-emerald-800 bg-emerald-950/20 p-4">
              <p className="text-xs text-emerald-500">Conciliados</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.totalConciliados}</p>
              <p className="mt-1 text-xs text-emerald-400">${stats.montoConciliados.toLocaleString('es-CO')}</p>
            </div>
            <div className="rounded-md border border-indigo-800 bg-indigo-950/20 p-4">
              <p className="text-xs text-indigo-400">Automático</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.conciliadosAutomaticos}</p>
              <p className="mt-1 text-xs text-indigo-300">${stats.montoAutomaticos.toLocaleString('es-CO')}</p>
            </div>
            <div className="rounded-md border border-violet-800 bg-violet-950/20 p-4">
              <p className="text-xs text-violet-400">Manual</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.conciliadosManuales}</p>
              <p className="mt-1 text-xs text-violet-300">${stats.montoManuales.toLocaleString('es-CO')}</p>
            </div>
            <div className="rounded-md border border-rose-800 bg-rose-950/20 p-4">
              <p className="text-xs text-rose-400">Error manual</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.totalErrorManual}</p>
              <p className="mt-1 text-xs text-rose-300">${stats.montoErrorManual.toLocaleString('es-CO')}</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="mb-4 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              📥 Descargar Excel
            </span>
          </button>
        </>
      )}

      {/* Detailed table */}
      {logs.length === 0 ? (
        <div className="rounded-md border border-slate-800 bg-slate-900 py-12 text-center">
          <p className="text-sm text-slate-400">No hay comprobantes en este rango de fechas.</p>
        </div>
      ) : (
        <div className="hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-500">
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 pr-4">Monto</th>
                <th className="pb-3 pr-4">Referencia</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Subido por</th>
                <th className="pb-3 pr-4">Conciliado por</th>
                <th className="pb-3 pr-4">Intentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-900/50">
                  <td className="py-3 pr-4 text-slate-300 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 pr-4 font-medium text-white whitespace-nowrap">
                    ${log.photoData.monto.toLocaleString('es-CO')}
                  </td>
                  <td className="py-3 pr-4 text-slate-300 font-mono text-xs">
                    {log.photoData.referencia}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      log.status === 'matched'
                        ? log.resolvedBy ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-500'
                        : log.status === 'manual_error'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {statusLabels[log.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">
                    {log.userId?.name || '-'}
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">
                    {log.resolvedBy?.name || (log.status === 'matched' ? 'Automático' : '-')}
                  </td>
                  <td className="py-3 pr-4 text-slate-500">
                    {log.retryCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ConfigTab() {
  const toast = useToastContext();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch('/api/modules/transfercheck/gmail-status')
      .then((res) => res.json())
      .then((data) => setConnected(data.connected))
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmail = params.get('gmail');
    const errorMsg = params.get('error');

    if (gmail === 'connected') {
      setConnected(true);
      window.history.replaceState({}, '', '/transfercheck');
    }

    if (errorMsg) {
      toast.error(decodeURIComponent(errorMsg));
      window.history.replaceState({}, '', '/transfercheck');
    }
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch('/api/modules/transfercheck/gmail-disconnect', { method: 'POST' });
      if (res.ok) {
        setConnected(false);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al desconectar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setDisconnecting(false);
    }
  }

  function handleConnect() {
    window.location.href = '/api/auth/gmail/connect?redirect=/transfercheck';
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-8">
      <div className="mx-auto max-w-md">
        <h3 className="text-lg font-semibold text-white">Conectar tu correo</h3>
        <p className="mt-2 text-sm text-slate-400">
          Conectá tu cuenta de Gmail para que podamos buscar automáticamente los correos de confirmación de tus transferencias.
        </p>

        <div className="mt-6 flex items-center gap-3">
          {connected ? (
            <>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                Conectado
              </span>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="rounded-md border border-rose-800 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
              >
                {disconnecting ? 'Desconectando...' : 'Desconectar Gmail'}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Conectar Gmail
            </button>
          )}
        </div>

          <div className="mt-8 space-y-4">
          <div className="rounded-md border border-slate-800 bg-slate-950 px-5 py-4">
            <p className="text-sm font-medium text-slate-300">¿Cómo funciona?</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-500">
              <li>Hacé clic en &quot;Conectar Gmail&quot; para autorizar a Zentral a buscar en tus correos.</li>
              <li>Cuando subas un comprobante, el sistema buscará correos que coincidan con el monto y la referencia.</li>
              <li>Si encuentra coincidencia, el pago se confirma automáticamente.</li>
              <li>Podés desconectar tu cuenta en cualquier momento.</li>
            </ol>
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-950 px-5 py-4">
            <p className="text-sm font-medium text-slate-300">Permisos solicitados</p>
            <p className="mt-2 text-xs text-slate-500">
              Solo lectura de correos (gmail.readonly). No enviamos correos ni modificamos tu bandeja.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DebugPanel({
  logId,
  debugResult,
  debugLoading,
  onDebug,
}: {
  logId: string;
  debugResult: DebugResult | null;
  debugLoading: boolean;
  onDebug: () => void;
}) {
  return (
    <div className="mt-6 rounded-md border border-amber-800 bg-amber-950/20 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-400">
          Debug Gmail Search
        </h3>
        <button
          onClick={onDebug}
          disabled={debugLoading}
          className="rounded-md bg-amber-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {debugLoading ? 'Buscando...' : 'Debug Search'}
        </button>
      </div>

      {debugResult && (
        <div className="mt-4 space-y-4">
          <div className="rounded border border-amber-800 bg-black/30 p-3">
            <p className="text-xs font-medium text-amber-400">Query enviada a Gmail:</p>
            <code className="mt-1 block text-xs text-amber-300 break-all">{debugResult.searchQuery}</code>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-amber-800 bg-black/30 p-3">
              <p className="text-xs font-medium text-amber-400">Variaciones de monto:</p>
              <ul className="mt-1 list-disc pl-4 text-xs text-amber-300 space-y-0.5">
                {debugResult.amountVariations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-amber-800 bg-black/30 p-3">
              <p className="text-xs font-medium text-amber-400">Variaciones de referencia:</p>
              <ul className="mt-1 list-disc pl-4 text-xs text-amber-300 space-y-0.5">
                {debugResult.referenceVariations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs text-amber-400">
            Correos encontrados: {debugResult.emails.length}
          </p>

          {debugResult.emails.length === 0 && (
            <p className="text-xs text-amber-500/60">
              Ningún correo coincide con el monto en las últimas 24h. Verificá que el correo esté en la bandeja y que Gmail esté conectado.
            </p>
          )}

          {debugResult.emails.map((email) => (
            <div key={email.messageId} className="rounded border border-amber-800 bg-black/30 p-4">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-amber-500">From:</span>
                  <p className="text-slate-300 mt-0.5">{email.from}</p>
                </div>
                <div>
                  <span className="text-amber-500">Date:</span>
                  <p className="text-slate-300 mt-0.5">{email.date}</p>
                </div>
                <div>
                  <span className="text-amber-500">Subject:</span>
                  <p className="text-slate-300 mt-0.5">{email.subject}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-3">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${email.matchedReference ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  Ref en Snippet/Subject: {email.matchedReference ? 'SI' : 'NO'}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${email.matchedReferenceInBody ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  Ref en Body: {email.matchedReferenceInBody ? 'SI' : 'NO'}
                </span>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-amber-500 hover:text-amber-400">
                  Snippet (primeras ~100 letras)
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/50 p-2 text-xs text-slate-400 whitespace-pre-wrap">{email.snippet}</pre>
              </details>

              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-amber-500 hover:text-amber-400">
                  Body completo (primeros 1000 caracteres)
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/50 p-2 text-xs text-slate-400 whitespace-pre-wrap">{email.bodyPreview}</pre>
              </details>
            </div>
          ))}

          {debugResult.error && (
            <div className="rounded border border-rose-800 bg-rose-500/10 p-3">
              <p className="text-xs text-rose-400">{debugResult.error}</p>
            </div>
          )}
        </div>
      )}

      {!debugResult && !debugLoading && (
        <p className="mt-2 text-xs text-amber-500/60">
          Presioná &quot;Debug Search&quot; para ver qué encuentra Gmail con los datos extraídos de este comprobante (logId: {logId}).
        </p>
      )}
    </div>
  );
}
