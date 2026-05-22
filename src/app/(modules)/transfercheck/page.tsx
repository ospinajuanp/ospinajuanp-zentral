'use client';

import { useState, useEffect, useCallback } from 'react';

type Tab = 'upload' | 'sync' | 'logs';

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

export default function TransferCheckDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [error, setError] = useState('');

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

      {/* Tabs */}
      <div className="mt-8 flex gap-1 rounded-lg bg-slate-900 p-1">
        {(['upload', 'sync', 'logs'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(''); }}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'upload' && 'Subir comprobante'}
            {tab === 'sync' && 'Sincronizar Gmail'}
            {tab === 'logs' && 'Historial'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-rose-500/10 px-4 py-3 text-sm text-rose-500" role="alert">
          {error}
        </div>
      )}

      <div className="mt-8">
        {activeTab === 'upload' && <UploadTab onError={setError} />}
        {activeTab === 'sync' && <SyncTab onError={setError} />}
        {activeTab === 'logs' && <LogsTab onError={setError} />}
      </div>
    </div>
  );
}

function UploadTab({ onError }: { onError: (msg: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<TransferLog | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    onError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/modules/transfercheck/process-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data.error || 'Error al procesar');
        return;
      }

      setResult(data.log);
    } catch {
      onError('Error de conexión');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="rounded-md border border-slate-800 bg-slate-900 p-8">
        <div className="mx-auto max-w-md">
          <label className="block text-sm font-medium text-slate-300">
            Comprobante de transferencia
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Subí una imagen de la transferencia. Gemini Flash extraerá automáticamente el monto y la referencia.
          </p>

          <div className="mt-4">
            <input
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
                Procesando con Gemini...
              </span>
            ) : (
              'Procesar comprobante'
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Resultado</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-xs text-slate-500">Monto</span>
              <p className="text-2xl font-bold text-white">
                ${result.photoData.monto.toLocaleString('es-CO')}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Referencia</span>
              <p className="text-2xl font-bold text-white">{result.photoData.referencia}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Estado</span>
              <p className={`text-2xl font-bold ${
                result.status === 'matched' ? 'text-emerald-500' :
                result.status === 'manual_error' ? 'text-rose-500' :
                'text-amber-400'
              }`}>
                {result.status === 'matched' ? 'Conciliado' :
                 result.status === 'manual_error' ? 'Error manual' :
                 'Pendiente'}
              </p>
            </div>
          </div>

          {result.emailData && (
            <div className="mt-4 rounded-md border border-emerald-800 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm text-emerald-400">
                Match automático encontrado en Gmail: {result.emailData.subject}
              </p>
            </div>
          )}

          {result.status === 'manual_error' && (
            <div className="mt-4 rounded-md border border-amber-700 bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-400">
                No se encontró match después de 3 reintentos. Usá la pestaña Historial para conciliar manualmente.
              </p>
            </div>
          )}

          <button
            onClick={() => { setResult(null); setFile(null); }}
            className="mt-4 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Subir otro comprobante
          </button>
        </div>
      )}
    </div>
  );
}

function SyncTab({ onError }: { onError: (msg: string) => void }) {
  const [syncing, setSyncing] = useState(false);
  const [processed, setProcessed] = useState<number | null>(null);

  async function handleSync() {
    setSyncing(true);
    onError('');

    try {
      const res = await fetch('/api/modules/transfercheck/sync-email', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        onError(data.error || 'Error al sincronizar');
        return;
      }

      setProcessed(data.processed);
    } catch {
      onError('Error de conexión');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-8">
      <div className="mx-auto max-w-md text-center">
        <h3 className="text-lg font-semibold text-white">Sincronización con Gmail</h3>
        <p className="mt-2 text-sm text-slate-400">
          Busca correos que coincidan con los comprobantes pendientes y concilia automáticamente.
        </p>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="mt-6 rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {syncing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Buscando coincidencias...
            </span>
          ) : (
            'Buscar coincidencias ahora'
          )}
        </button>

        {processed !== null && (
          <div className="mt-6 rounded-md border border-emerald-800 bg-emerald-500/10 px-4 py-3">
            <p className="text-sm text-emerald-400">
              {processed} comprobante{processed !== 1 ? 's' : ''} procesado{processed !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        <div className="mt-8 rounded-md border border-slate-800 bg-slate-950 px-5 py-4 text-left">
          <p className="text-sm font-medium text-slate-300">Backoff de reintentos</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            <li>Retry 1 → espera 5 min</li>
            <li>Retry 2 → espera 15 min</li>
            <li>Retry 3 → espera 30 min</li>
            <li>Retry 4+ → requiere conciliación manual</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LogsTab({ onError }: { onError: (msg: string) => void }) {
  const [logs, setLogs] = useState<TransferLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<{ logId: string; monto: string; referencia: string } | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/modules/transfercheck/logs?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      }
    } catch {
      onError('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, onError]);

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
        setManualForm(null);
        fetchLogs();
      } else {
        const data = await res.json();
        onError(data.error || 'Error al conciliar');
      }
    } catch {
      onError('Error de conexión');
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
      <div className="flex flex-wrap gap-2 mb-6">
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-md border border-slate-800 bg-slate-900 py-12 text-center">
          <p className="text-sm text-slate-400">No hay comprobantes registrados.</p>
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
                  <th className="pb-3 pr-4">Reintentos</th>
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
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : log.status === 'manual_error'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {statusLabels[log.status]}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-slate-500">
                      {log.retryCount}
                    </td>
                    <td className="py-4 text-right">
                      {log.status === 'manual_error' && (
                        <button
                          onClick={() => setManualForm({ logId: log._id, monto: String(log.photoData.monto), referencia: log.photoData.referencia })}
                          className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Conciliar
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
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    log.status === 'matched'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : log.status === 'manual_error'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {statusLabels[log.status]}
                  </span>
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
                {log.status === 'manual_error' && (
                  <button
                    onClick={() => setManualForm({ logId: log._id, monto: String(log.photoData.monto), referencia: log.photoData.referencia })}
                    className="mt-3 w-full rounded-md border border-slate-700 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Conciliar manualmente
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
              Ingresá los datos correctos de la transferencia.
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
