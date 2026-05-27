'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UsePaginatedDataOptions {
  defaultLimit?: number;
  extraParams?: Record<string, string>;
}

export function usePaginatedData<T>(endpoint: string, options?: UsePaginatedDataOptions) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(options?.defaultLimit ?? 10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const buildUrl = useCallback(
    (p: number, l: number) => {
      const params = new URLSearchParams({ page: String(p), limit: String(l) });
      if (options?.extraParams) {
        Object.entries(options.extraParams).forEach(([k, v]) => {
          params.set(k, v);
        });
      }
      return `${endpoint}?${params}`;
    },
    [endpoint, options?.extraParams],
  );

  const fetchPage = useCallback(
    async (p: number, l: number) => {
      setLoading(true);
      try {
        const res = await fetch(buildUrl(p, l));
        const data: PaginatedResponse<T> = await res.json();
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? p);
        setTotalPages(data.totalPages ?? 0);
        setLimit(l);
      } finally {
        setLoading(false);
      }
    },
    [buildUrl],
  );

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchPage(1, options?.defaultLimit ?? 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePage = useCallback(
    (p: number) => fetchPage(p, limit),
    [fetchPage, limit],
  );
  const changeLimit = useCallback(
    (l: number) => fetchPage(1, l),
    [fetchPage],
  );
  const refresh = useCallback(
    () => fetchPage(page, limit),
    [fetchPage, page, limit],
  );

  return {
    items,
    loading,
    page,
    limit,
    total,
    totalPages,
    changePage,
    changeLimit,
    refresh,
  };
}
