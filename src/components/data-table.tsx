'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { PaginationBar } from '@/components/pagination';

export interface DataColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
  keyField: keyof T;
  loading: boolean;
  emptyMessage: string;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  title?: string;
  titleCount?: number;
  titleCountLabel?: string;
  createHref?: string;
  createLabel?: string;
  actions?: (item: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  loading,
  emptyMessage,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  title,
  titleCount,
  titleCountLabel,
  createHref,
  createLabel,
  actions,
}: DataTableProps<T>) {
  const hasActions = !!actions;

  return (
    <div>
      {(title || createHref) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            )}
            {titleCount !== undefined && titleCountLabel && (
              <p className="mt-1 text-sm text-slate-400">
                {titleCount} {titleCountLabel}.
              </p>
            )}
          </div>
          {createHref && createLabel && (
            <Link
              href={createHref}
              className="w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {createLabel}
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="mt-8 overflow-hidden rounded-md border border-slate-800 bg-slate-900">
          <div className="px-6 py-12 text-center text-sm text-slate-500">{emptyMessage}</div>
        </div>
      ) : (
        <>
          <div className="mt-8 hidden overflow-hidden rounded-md border border-slate-800 bg-slate-900 sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-left">
                    {columns.map((col, i) => (
                      <th key={i} className="px-6 py-3 font-medium text-slate-400">
                        {col.header}
                      </th>
                    ))}
                    {hasActions && (
                      <th className="px-6 py-3 font-medium text-slate-400">Accion</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={String(item[keyField])} className="border-b border-slate-800 last:border-none">
                      {columns.map((col, i) => (
                        <td key={i} className="px-6 py-4">
                          {col.render(item)}
                        </td>
                      ))}
                      {hasActions && (
                        <td className="px-6 py-4">{actions!(item)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 space-y-3 sm:hidden">
            {data.map((item) => (
              <div
                key={String(item[keyField])}
                className="rounded-md border border-slate-800 bg-slate-900 p-4"
              >
                <div className="text-sm font-medium text-white">
                  {columns[0].render(item)}
                </div>
                {columns.length > 1 && (
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    {columns.slice(1).map((col, i) => (
                      <div key={i} className="pb-3">
                        <span className="block text-slate-500">{col.header}</span>
                        {col.render(item)}
                      </div>
                    ))}
                    {hasActions && (
                      <div className="pb-3">
                        <span className="block text-slate-500">Accion</span>
                        {actions!(item)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </>
      )}
    </div>
  );
}
