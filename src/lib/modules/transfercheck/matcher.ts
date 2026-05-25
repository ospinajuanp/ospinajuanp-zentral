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

  const now = new Date();

  // Reset quota only if period has elapsed (or never set)
  await ModuleSubscription.findOneAndUpdate(
    {
      workspace: workspaceId,
      moduleKey: 'transfercheck',
      status: 'active',
      $or: [
        { quotaResetAt: { $lte: now } },
        { quotaResetAt: null },
        { quotaResetAt: { $exists: false } },
      ],
    },
    {
      $set: {
        usedQuota: 0,
        quotaResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    }
  );

  const sub = await ModuleSubscription.findOne({
    workspace: workspaceId,
    moduleKey: 'transfercheck',
    status: 'active',
  }).lean();

  if (!sub) return { allowed: false, remaining: 0 };
  if (sub.monthlyQuota <= 0) return { allowed: true, remaining: -1 };

  const remaining = sub.monthlyQuota - sub.usedQuota;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export async function consumeQuota(
  workspaceId: string,
  count = 1
): Promise<{ consumed: boolean; remaining: number }> {
  await dbConnect();

  if (count <= 0) {
    const sub = await ModuleSubscription.findOne({
      workspace: workspaceId,
      moduleKey: 'transfercheck',
      status: 'active',
    }).lean();
    const rem = sub ? Math.max(0, sub.monthlyQuota - sub.usedQuota) : 0;
    return { consumed: true, remaining: rem };
  }

  const result = await ModuleSubscription.findOneAndUpdate(
    {
      workspace: workspaceId,
      moduleKey: 'transfercheck',
      status: 'active',
      $expr: { $gte: [{ $subtract: ['$monthlyQuota', '$usedQuota'] }, count] },
    },
    { $inc: { usedQuota: count } },
    { new: true, lean: true }
  );

  if (!result) {
    const sub = await ModuleSubscription.findOne({
      workspace: workspaceId,
      moduleKey: 'transfercheck',
      status: 'active',
    }).lean();
    const rem = sub ? Math.max(0, sub.monthlyQuota - sub.usedQuota) : 0;
    return { consumed: false, remaining: rem };
  }

  return {
    consumed: true,
    remaining: Math.max(0, result.monthlyQuota - result.usedQuota),
  };
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

export async function processPendingMatches(
  workspaceId: string,
  maxToProcess?: number
): Promise<{ processed: number; results: SyncItemResult[] }> {
  await dbConnect();

  let query = TransferCheckLog.find({
    workspace: workspaceId,
    status: 'pending_email',
  }).sort({ createdAt: 1 });

  if (maxToProcess !== undefined) {
    query = query.limit(maxToProcess);
  } else {
    query = query.limit(50);
  }

  const logs = await query;

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
