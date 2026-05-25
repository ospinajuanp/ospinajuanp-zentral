import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';

export async function recalculateQuotas(workspaceId: string) {
  await dbConnect();

  const activePurchases = await WorkspacePurchase.find({
    workspace: workspaceId,
    status: 'active',
  }).lean();

  // Aggregate quota per module from all active purchases
  const quotaMap = new Map<string, { quota: number; tier: string }>();

  for (const purchase of activePurchases) {
    for (const mod of purchase.modules) {
      const existing = quotaMap.get(mod.moduleKey);
      if (existing) {
        existing.quota += mod.quota;
      } else {
        quotaMap.set(mod.moduleKey, { quota: mod.quota, tier: mod.tier });
      }
    }
  }

  // Delete subs for modules no longer present in any active purchase
  const allModuleKeys = [...quotaMap.keys()];
  if (allModuleKeys.length > 0) {
    await ModuleSubscription.deleteMany({
      workspace: workspaceId,
      moduleKey: { $nin: allModuleKeys },
    });
  } else {
    await ModuleSubscription.deleteMany({ workspace: workspaceId });
  }

  // Upsert each module subscription with aggregated quota
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  for (const [moduleKey, data] of quotaMap) {
    const existing = await ModuleSubscription.findOne({
      workspace: workspaceId,
      moduleKey,
    });

    if (existing) {
      existing.monthlyQuota = data.quota;
      existing.tier = data.tier;
      existing.status = 'active';
      await existing.save();
    } else {
      await ModuleSubscription.create({
        workspace: workspaceId,
        moduleKey,
        tier: data.tier,
        status: 'active',
        monthlyQuota: data.quota,
        usedQuota: 0,
        quotaResetAt: nextMonth,
      });
    }
  }
}
