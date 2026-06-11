import { AuditLog, type AuditAction, type AuditEntity } from '@/lib/models/audit-log';
import type { NextRequest } from 'next/server';

interface AuditLogParams {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  workspaceId?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const { request, ...logParams } = params;

  const ip = request?.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request?.headers.get('x-real-ip')
    ?? null;

  const userAgent = request?.headers.get('user-agent') ?? null;

  await AuditLog.create({
    ...logParams,
    ip,
    userAgent,
  });
}

export function calculateChanges<T extends Record<string, unknown>>(
  before: T | null,
  after: T,
  fieldsToTrack: string[]
): Record<string, { old: unknown; new: unknown }> | undefined {
  if (!before) return undefined;

  const changes: Record<string, { old: unknown; new: unknown }> = {};

  for (const field of fieldsToTrack) {
    const oldVal = before[field];
    const newVal = after[field];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[field] = { old: oldVal, new: newVal };
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}