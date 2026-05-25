import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { TransferCheckLog, type IPhotoData } from '@/lib/models/transfercheck-log';
import { searchTransferEmails } from './gmail-service';
import type { ITransferCheckLog } from '@/lib/models/transfercheck-log';

export async function checkQuota(
  workspaceId: string
): Promise<{ allowed: boolean; remaining: number }> {
  // TEMPORARY DEBUG: bypass quota check
  return { allowed: true, remaining: 999 };
}

export async function consumeQuota(workspaceId: string): Promise<void> {
  await dbConnect();
  await ModuleSubscription.findOneAndUpdate(
    { workspace: workspaceId, moduleKey: 'transfercheck', status: 'active' },
    { $inc: { usedQuota: 1 } }
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
    log.nextRetryAt = null;
    await log.save();
    return log;
  } catch (error) {
    console.error('[matcher] Error processing match:', error);
    return log;
  }
}

export async function processPendingMatches(workspaceId: string): Promise<number> {
  await dbConnect();

  const logs = await TransferCheckLog.find({
    workspace: workspaceId,
    status: 'pending_email',
  }).limit(50);

  let processed = 0;
  for (const log of logs) {
    await processPendingMatch(String(log._id), workspaceId);
    processed += 1;
  }

  return processed;
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
