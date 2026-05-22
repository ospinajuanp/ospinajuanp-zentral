import dbConnect from './db/mongoose';
import { ModuleSubscription } from './models/module-subscription';

export async function checkQuota(
  workspaceId: string,
  moduleKey: string,
  increment = 0
): Promise<{ allowed: boolean; remaining: number; quota: number; used: number }> {
  await dbConnect();

  const sub = await ModuleSubscription.findOne({
    workspace: workspaceId,
    moduleKey: moduleKey.toLowerCase(),
    status: 'active',
  });

  if (!sub) {
    return { allowed: false, remaining: 0, quota: 0, used: 0 };
  }

  if (sub.monthlyQuota <= 0) {
    return { allowed: true, remaining: -1, quota: sub.monthlyQuota, used: sub.usedQuota };
  }

  const now = new Date();

  if (!sub.quotaResetAt) {
    sub.quotaResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  if (now >= sub.quotaResetAt) {
    sub.usedQuota = 0;
    sub.quotaResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  const remaining = sub.monthlyQuota - sub.usedQuota;

  if (increment > 0 && remaining < increment) {
    await sub.save();
    return { allowed: false, remaining: Math.max(0, remaining), quota: sub.monthlyQuota, used: sub.usedQuota };
  }

  if (increment > 0) {
    sub.usedQuota += increment;
    await sub.save();
  }

  return {
    allowed: true,
    remaining: sub.monthlyQuota - sub.usedQuota,
    quota: sub.monthlyQuota,
    used: sub.usedQuota,
  };
}

export async function getQuotaInfo(
  workspaceId: string,
  moduleKey: string
): Promise<{ quota: number; used: number; remaining: number; tier: string; status: string } | null> {
  await dbConnect();

  const sub = await ModuleSubscription.findOne({
    workspace: workspaceId,
    moduleKey: moduleKey.toLowerCase(),
  });

  if (!sub) return null;

  return {
    quota: sub.monthlyQuota,
    used: sub.usedQuota,
    remaining: sub.monthlyQuota - sub.usedQuota,
    tier: sub.tier,
    status: sub.status,
  };
}
