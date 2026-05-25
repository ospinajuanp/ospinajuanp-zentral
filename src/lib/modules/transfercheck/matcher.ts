import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { TransferCheckLog, type IPhotoData } from '@/lib/models/transfercheck-log';
import { searchTransferEmails } from './gmail-service';
import type { ITransferCheckLog } from '@/lib/models/transfercheck-log';

const MAX_RETRIES = 3;

export async function checkQuota(
  workspaceId: string
): Promise<{ allowed: boolean; remaining: number }> {
  await dbConnect();
  const sub = await ModuleSubscription.findOne({
    workspace: workspaceId,
    moduleKey: 'transfercheck',
    status: 'active',
  });

  if (!sub) return { allowed: false, remaining: 0 };
  if (sub.monthlyQuota <= 0) return { allowed: true, remaining: -1 };

  const now = new Date();
  if (sub.quotaResetAt && now >= sub.quotaResetAt) {
    sub.usedQuota = 0;
    sub.quotaResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await sub.save();
  }

  const remaining = sub.monthlyQuota - sub.usedQuota;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export async function consumeQuota(workspaceId: string, count = 1): Promise<void> {
  await dbConnect();
  await ModuleSubscription.findOneAndUpdate(
    { workspace: workspaceId, moduleKey: 'transfercheck', status: 'active' },
    { $inc: { usedQuota: count } }
  );
}

export async function processPendingMatch(logId: string, workspaceId: string): Promise<ITransferCheckLog | null> {
  await dbConnect();

  const log = await TransferCheckLog.findById(logId);
  if (!log || log.status !== 'pending_email') return log;

  try {
    const result = await searchTransferEmails(log.photoData, workspaceId);

    if (result.success && result.matches.length > 0) {
      log.status = 'matched';
      log.emailData = result.matches[0];
      log.matchedAt = new Date();
      log.nextRetryAt = null;
      await log.save();
      return log;
    }

    log.retryCount += 1;

    if (log.retryCount >= MAX_RETRIES) {
      log.status = 'manual_error';
    }

    log.nextRetryAt = null;
    await log.save();
    return log;
  } catch (error) {
    console.error('[matcher] Error processing match:', error);
    return log;
  }
}

export interface SyncItemResult {
  logId: string;
  referencia: string;
  monto: number;
  newStatus: 'matched' | 'pending_email' | 'manual_error';
  error?: string;
}

export async function processPendingMatches(workspaceId: string): Promise<{ processed: number; results: SyncItemResult[] }> {
  await dbConnect();

  const logs = await TransferCheckLog.find({
    workspace: workspaceId,
    status: 'pending_email',
  }).limit(50);

  const results: SyncItemResult[] = [];

  for (const log of logs) {
    const updated = await processPendingMatch(String(log._id), workspaceId);
    if (updated) {
      const result: SyncItemResult = {
        logId: String(updated._id),
        referencia: updated.photoData.referencia,
        monto: updated.photoData.monto,
        newStatus: updated.status,
      };
      results.push(result);
    }
  }

  return { processed: logs.length, results };
}

export async function createTransferCheckLog(
  workspaceId: string,
  userId: string,
  photoData: IPhotoData
): Promise<ITransferCheckLog> {
  await dbConnect();

  const log = await TransferCheckLog.create({
    workspace: workspaceId,
    userId,
    photoData,
    status: 'pending_email',
    retryCount: 0,
    nextRetryAt: null,
  });

  return log;
}
