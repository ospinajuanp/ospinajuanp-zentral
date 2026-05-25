'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { ToastProvider } from '@/contexts/toast-context';
import { getGlobalToast } from '@/contexts/toast-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ErrorBoundaryInner>{children}</ErrorBoundaryInner>
      </ToastProvider>
    </ErrorBoundary>
  );
}

function ErrorBoundaryInner({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={() => {
        try {
          const toast = getGlobalToast();
          toast.error('Ocurrio un error inesperado. Reintenta.');
        } catch {
          // Toast not mounted yet
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
