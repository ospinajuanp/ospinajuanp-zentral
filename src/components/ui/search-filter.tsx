'use client';

import { useState, useCallback, type ReactNode } from 'react';

interface SearchFilterProps {
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  debounceMs?: number;
  filters?: ReactNode;
  className?: string;
}

export function SearchFilter({
  placeholder = 'Buscar...',
  searchValue,
  onSearchChange,
  debounceMs = 300,
  filters,
  className = '',
}: SearchFilterProps) {
  const [inputValue, setInputValue] = useState(searchValue);
  const timerRef = { current: null as NodeJS.Timeout | null };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onSearchChange(value);
    }, debounceMs);
  }, [debounceMs, onSearchChange]);

  const handleClear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setInputValue('');
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="block w-full rounded-md border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
            aria-label="Limpiar búsqueda"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {filters && <div className="flex items-center gap-2">{filters}</div>}
    </div>
  );
}