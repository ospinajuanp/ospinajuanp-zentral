'use client';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZES = [5, 10, 20, 50, 100];

export function PaginationBar({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: PaginationBarProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>
          {from}–{to} de {total}
        </span>
        <span className="text-slate-700">|</span>
        <label className="flex items-center gap-1">
          Mostrar
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginacion">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              page <= 1
                ? 'cursor-not-allowed text-slate-600'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            ← Anterior
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-xs text-slate-600">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              page >= totalPages
                ? 'cursor-not-allowed text-slate-600'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Siguiente →
          </button>
        </nav>
      )}
    </div>
  );
}
