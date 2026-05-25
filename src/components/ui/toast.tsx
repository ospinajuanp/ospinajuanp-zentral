'use client';

import { useEffect, useState } from 'react';

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

let nextId = 0;

export function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const config = {
    success: { bg: 'bg-emerald-500/10 border-emerald-800', text: 'text-emerald-400', icon: '✓' },
    error: { bg: 'bg-rose-500/10 border-rose-800', text: 'text-rose-400', icon: '✗' },
    info: { bg: 'bg-indigo-500/10 border-indigo-800', text: 'text-indigo-400', icon: 'ℹ' },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm rounded-md border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-right ${config.bg}`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-sm ${config.text}`}>{config.icon}</span>
        <p className={`flex-1 ${config.text}`}>{toast.message}</p>
        <button onClick={onDismiss} className={`ml-2 shrink-0 text-xs ${config.text} hover:opacity-70`}>
          ✕
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function add(type: ToastItem['type'], message: string) {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return {
    toasts,
    success: (message: string) => add('success', message),
    error: (message: string) => add('error', message),
    info: (message: string) => add('info', message),
    dismiss,
  };
}

export function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
