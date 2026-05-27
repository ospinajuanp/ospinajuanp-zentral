import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { AppSettings, clearSettingsCache } from '@/lib/models/app-settings';

const ALLOWED_KEYS = [
  'registrationEnabled',
  'loginEnabled',
  'emailVerificationRequired',
  'passwordResetEnabled',
  'transactionalEmailsEnabled',
  'simulatedPurchaseEnabled',
  'transferCheckEnabled',
  'gmailOAuthEnabled',
  'publicPlansApiEnabled',
  'debugEndpointsEnabled',
  'workspacesEnabled',
  'modulesEnabled',
  'plansEnabled',
  'usersEnabled',
  'moduleAccessEnabled',
  'adminUsersEnabled',
  'adminPlansEnabled',
  'maintenanceMode',
  'maintenanceMessage',
] as const;

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await dbConnect();

    let settings = await AppSettings.findOne().lean();
    if (!settings) {
      const created = await AppSettings.create({});
      settings = created.toJSON();
    }

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[settings] GET error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const update: Record<string, unknown> = {};

    for (const key of ALLOWED_KEYS) {
      if (key in body && typeof body[key] === (key === 'maintenanceMessage' ? 'string' : 'boolean')) {
        update[key] = body[key];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No se enviaron campos validos' }, { status: 400 });
    }

    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create(update);
    } else {
      Object.assign(settings, update);
      await settings.save();
    }

    clearSettingsCache();

    return NextResponse.json({
      message: 'Configuracion actualizada',
      settings: settings.toJSON(),
    });
  } catch (err) {
    console.error('[settings] PATCH error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
