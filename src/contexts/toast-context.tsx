'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useToast, ToastContainer } from '@/components/ui/toast';

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext debe usarse dentro de ToastProvider');
  return ctx;
}

let savedToast: ToastContextValue | null = null;

export function getGlobalToast(): ToastContextValue {
  if (!savedToast) throw new Error('ToastProvider no esta montado');
  return savedToast;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, success, error, info, dismiss } = useToast();
  savedToast = { success, error, info };

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}
