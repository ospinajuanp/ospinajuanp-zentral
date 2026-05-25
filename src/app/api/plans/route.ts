import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import dbConnect from '@/lib/db/mongoose';
import { Plan } from '@/lib/models/plan';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const plans = await Plan.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .populate('includedModules.module', 'key name description tier')
      .lean();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('[plans] Error:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los planes.' },
      { status: 500 }
    );
  }
}
