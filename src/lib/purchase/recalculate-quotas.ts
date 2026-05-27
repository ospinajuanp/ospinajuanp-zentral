import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';

export async function recalculateQuotas(workspaceId: string) {
  await dbConnect();

  const activePurchases = await WorkspacePurchase.find({
    workspace: workspaceId,
    status: 'active',
    paymentMethod: { $ne: 'manual' },
  }).lean();

  const quotaMap = new Map<string, { quota: number; tier: string; autoRenew: boolean }>();

  for (const purchase of activePurchases) {
    for (const mod of purchase.modules) {
      const existing = quotaMap.get(mod.moduleKey);
      if (existing) {
        existing.quota += mod.quota;
        if (mod.autoRenew) existing.autoRenew = true;
      } else {
        quotaMap.set(mod.moduleKey, {
          quota: mod.quota,
          tier: mod.tier,
          autoRenew: mod.autoRenew ?? false,
        });
      }
    }
  }

  // Delete non-enterprise subs for modules no longer in any active plan purchase
  const allModuleKeys = [...quotaMap.keys()];
  if (allModuleKeys.length > 0) {
    await ModuleSubscription.deleteMany({
      workspace: workspaceId,
      moduleKey: { $nin: allModuleKeys },
      tier: { $ne: 'enterprise' },
    });
  } else {
    await ModuleSubscription.deleteMany({
      workspace: workspaceId,
      tier: { $ne: 'enterprise' },
    });
  }

  // Upsert each module subscription with aggregated quota (only non-enterprise)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  for (const [moduleKey, data] of quotaMap) {
    const existing = await ModuleSubscription.findOne({
      workspace: workspaceId,
      moduleKey,
      tier: { $ne: 'enterprise' },
    });

    if (existing) {
      existing.monthlyQuota = data.quota;
      existing.tier = data.tier;
      existing.status = 'active';
      existing.autoRenew = data.autoRenew;
      await existing.save();
    } else {
      await ModuleSubscription.create({
        workspace: workspaceId,
        moduleKey,
        tier: data.tier,
        status: 'active',
        monthlyQuota: data.quota,
        usedQuota: 0,
        autoRenew: data.autoRenew,
        quotaResetAt: nextMonth,
      });
    }
  }
}
