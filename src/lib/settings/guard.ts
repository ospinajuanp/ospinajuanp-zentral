import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { getAppSettings } from '@/lib/models/app-settings';

const SUPERADMIN_EXEMPT = new Set(['loginEnabled', 'maintenanceMode', 'moduleAccessEnabled']);
const NOT_FOUND_TOGGLES = new Set(['debugEndpointsEnabled']);

export async function checkFeatureEnabled(
  req: NextRequest,
  toggleKey: string,
): Promise<NextResponse | null> {
  const settings = await getAppSettings();
  const value = (settings as unknown as Record<string, unknown>)[toggleKey];

  if (value !== false) return null;

  if (SUPERADMIN_EXEMPT.has(toggleKey)) {
    const auth = await getApiAuth(req);
    if (auth?.role === 'superadmin') return null;
  }

  const status = NOT_FOUND_TOGGLES.has(toggleKey) ? 404 : 403;
  const error = status === 404 ? 'Not Found' : 'Funcionalidad deshabilitada';

  return NextResponse.json({ error }, { status });
}
