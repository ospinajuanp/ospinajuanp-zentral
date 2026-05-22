'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  itemName: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  itemName,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-10 w-full max-w-sm rounded-md border border-slate-700 bg-slate-900 p-6 shadow-xl"
      >
        <h2
          id="confirm-title"
          className="text-lg font-semibold text-white"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {message}
        </p>

        <div className="mt-1 rounded-md bg-slate-800 px-3 py-2">
          <p className="text-sm font-medium text-white">{itemName}</p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
