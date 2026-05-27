import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAppSettings } from '@/lib/models/app-settings';
import { getSession } from '@/lib/auth';

async function getPathname(): Promise<string> {
  const h = await headers();
  const raw =
    h.get('x-url') ||
    h.get('x-original-uri') ||
    h.get('x-forwarded-uri') ||
    h.get('next-url') ||
    '';
  if (!raw) return '';
  try {
    return new URL(raw, 'http://localhost').pathname;
  } catch {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
}

export async function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = await getPathname();

  if (pathname.startsWith('/api/') || pathname === '/maintenance') {
    return <>{children}</>;
  }

  const settings = await getAppSettings();
  if (!settings.maintenanceMode) {
    return <>{children}</>;
  }

  const session = await getSession();
  if (session?.role === 'superadmin') {
    return <>{children}</>;
  }

  redirect('/maintenance');
}
