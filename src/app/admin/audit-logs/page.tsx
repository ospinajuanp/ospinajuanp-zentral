'use client';

import { useState, useCallback } from 'react';
import { usePaginatedData } from '@/hooks/use-paginated-data';
import { DataTable, type DataColumn } from '@/components/data-table';
import { SearchFilter } from '@/components/ui/search-filter';

interface AuditLogItem {
  _id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  workspaceId?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-400',
  update: 'bg-sky-500/10 text-sky-400',
  delete: 'bg-rose-500/10 text-rose-400',
  activate: 'bg-emerald-500/10 text-emerald-400',
  deactivate: 'bg-amber-500/10 text-amber-400',
  login: 'bg-indigo-500/10 text-indigo-400',
  logout: 'bg-slate-500/10 text-slate-400',
};

const ENTITY_LABELS: Record<string, string> = {
  User: 'Usuario',
  Workspace: 'Workspace',
  Plan: 'Plan',
  Module: 'Módulo',
  ModuleSubscription: 'Suscripción',
  AppSettings: 'Configuración',
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    entity: '',
    action: '',
    search: '',
  });

  const buildExtraParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (filters.entity) params.entity = filters.entity;
    if (filters.action) params.action = filters.action;
    if (filters.search) params.search = filters.search;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [filters]);

  const {
    items: logs,
    loading,
    page,
    limit,
    total,
    totalPages,
    changePage,
    changeLimit,
  } = usePaginatedData<AuditLogItem>('/api/admin/audit-logs', {
    defaultLimit: 20,
    extraParams: buildExtraParams(),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const columns: DataColumn<AuditLogItem>[] = [
    {
      header: 'Fecha',
      render: (log) => (
        <span className="text-slate-400">
          {new Date(log.createdAt).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Acción',
      render: (log) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-slate-800 text-slate-400'}`}>
          {log.action}
        </span>
      ),
    },
    {
      header: 'Entidad',
      render: (log) => (
        <div>
          <span className="font-medium text-white">{ENTITY_LABELS[log.entity] ?? log.entity}</span>
          <span className="ml-2 font-mono text-xs text-slate-500">{log.entityId.slice(-6)}</span>
        </div>
      ),
    },
    {
      header: 'Usuario',
      render: (log) => (
        <div>
          <span className="text-white">{log.userEmail}</span>
          <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{log.userRole}</span>
        </div>
      ),
    },
    {
      header: 'Detalles',
      render: (log) => {
        if (log.changes && Object.keys(log.changes).length > 0) {
          const changedFields = Object.keys(log.changes).join(', ');
          return <span className="text-slate-400">Campos: {changedFields}</span>;
        }
        if (log.metadata) {
          const metaStr = JSON.stringify(log.metadata).slice(0, 30);
          return <span className="text-slate-500">{metaStr}...</span>;
        }
        return <span className="text-slate-600">—</span>;
      },
    },
    {
      header: 'IP',
      render: (log) => <span className="font-mono text-slate-500">{log.ip ?? '—'}</span>,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} registro{total !== 1 ? 's' : ''} de actividad
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select
          value={filters.entity}
          onChange={(e) => handleFilterChange('entity', e.target.value)}
          className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">Todas las entidades</option>
          <option value="User">Usuario</option>
          <option value="Workspace">Workspace</option>
          <option value="Plan">Plan</option>
          <option value="Module">Módulo</option>
        </select>

        <select
          value={filters.action}
          onChange={(e) => handleFilterChange('action', e.target.value)}
          className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">Todas las acciones</option>
          <option value="create">Crear</option>
          <option value="update">Actualizar</option>
          <option value="delete">Eliminar</option>
          <option value="activate">Activar</option>
          <option value="deactivate">Desactivar</option>
        </select>

        <SearchFilter
          searchValue={filters.search}
          onSearchChange={(v: string) => handleFilterChange('search', v)}
          placeholder="Buscar por email de usuario..."
          className="flex-1"
        />
      </div>

      <DataTable
        columns={columns}
        data={logs}
        keyField="_id"
        loading={loading}
        emptyMessage="No hay logs de auditoría."
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={changePage}
        onLimitChange={changeLimit}
      />
    </div>
  );
}