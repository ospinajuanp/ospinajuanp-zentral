import Link from 'next/link';
import { getAppSettings } from '@/lib/models/app-settings';

export default async function MaintenancePage() {
  const settings = await getAppSettings();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <svg
              className="h-8 w-8 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.42 15.17l-2.75-2.75a.5.5 0 010-.71l.71-.71a.5.5 0 01.71 0L12 12.88l3.11-3.11a.5.5 0 01.71 0l.71.71a.5.5 0 010 .71l-4.07 4.07a.5.5 0 01-.71 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.42 15.17l-5.3-5.3a.5.5 0 010-.71l.71-.71a.5.5 0 01.71 0L12 13.17l4.46-4.46a.5.5 0 01.71 0l.71.71a.5.5 0 010 .71l-6.07 6.07a.5.5 0 01-.71 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Mantenimiento
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {settings?.maintenanceMessage || 'Zentral esta en mantenimiento. Volveremos pronto.'}
        </p>

        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            Acceso administrador
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-600">
          Solo el superadministrador puede acceder durante el mantenimiento.
        </p>
      </div>
    </div>
  );
}
