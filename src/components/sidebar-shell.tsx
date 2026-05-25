'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/error-boundary';

interface BottomNavItem {
  label: string;
  href: string;
  icon: ReactNode;
  exact?: boolean;
}

interface SidebarShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  bottomNav: BottomNavItem[];
}

export function SidebarShell({ sidebar, children, bottomNav }: SidebarShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
        <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900 lg:flex lg:sticky lg:top-0 lg:h-screen" aria-label="Barra lateral">
        {sidebar}
      </aside>

      {/* main */}
      <main className="flex-1 bg-slate-950 px-4 pb-20 pt-4 lg:px-8 lg:pb-8 lg:pt-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center border-t border-slate-800 bg-slate-900 px-2 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navegacion movil">
        {bottomNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu de navegacion"
          aria-expanded={open}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
            open ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Más
        </button>
      </nav>

      {/* mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 lg:hidden"
          role="button"
          tabIndex={0}
          aria-label="Cerrar menu"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setOpen(false);
            if (e.key === 'Escape') setOpen(false);
          }}
        />
      )}

      {/* mobile bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[70vh] flex-col rounded-t-xl border-t border-slate-700 bg-slate-900 transition-transform duration-200 lg:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegacion"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <span className="text-base font-bold tracking-tight text-white">Navegación</span>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400"
            aria-label="Cerrar menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {sidebar}
        </div>
      </div>
    </div>
  );
}
