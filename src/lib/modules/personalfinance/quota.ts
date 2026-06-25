import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';

export async function checkQuota(
  workspaceId: string
): Promise<{ allowed: boolean; remaining: number }> {
  await dbConnect();

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const subs = await ModuleSubscription.find({
    workspace: workspaceId,
    moduleKey: 'personalfinance',
    status: 'active',
  }).lean();

  if (!subs.length) return { allowed: false, remaining: 0 };

  for (const sub of subs) {
    if (sub.quotaResetAt && now >= new Date(sub.quotaResetAt)) {
      await ModuleSubscription.updateOne(
        { _id: sub._id },
        { $set: { usedQuota: 0, quotaResetAt: nextMonth } }
      );
    }
  }

  let totalQuota = 0;
  let totalUsed = 0;
  for (const s of subs) {
    totalQuota += s.monthlyQuota;
    totalUsed += s.usedQuota;
  }

  if (totalQuota <= 0) return { allowed: true, remaining: -1 };

  const remaining = totalQuota - totalUsed;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export async function consumeQuota(
  workspaceId: string,
  count = 1
): Promise<{ consumed: boolean; remaining: number }> {
  await dbConnect();

  if (count <= 0) {
    const subs = await ModuleSubscription.find({
      workspace: workspaceId,
      moduleKey: 'personalfinance',
      status: 'active',
    }).lean();
    let rem = 0;
    for (const s of subs) rem += Math.max(0, s.monthlyQuota - s.usedQuota);
    return { consumed: true, remaining: rem };
  }

  const subs = await ModuleSubscription.find({
    workspace: workspaceId,
    moduleKey: 'personalfinance',
    status: 'active',
  }).lean();

  const sorted = [...subs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let totalRemaining = 0;

  for (const s of sorted) {
    const result = await ModuleSubscription.findOneAndUpdate(
      {
        _id: s._id,
        $expr: { $gte: [{ $subtract: ['$monthlyQuota', '$usedQuota'] }, count] },
      },
      { $inc: { usedQuota: count } },
      { returnDocument: 'after', lean: true }
    );

    if (result) {
      for (const other of sorted) {
        if (other._id.toString() === result._id.toString()) continue;
        totalRemaining += Math.max(0, other.monthlyQuota - other.usedQuota);
      }
      totalRemaining += Math.max(0, result.monthlyQuota - result.usedQuota);
      return { consumed: true, remaining: totalRemaining };
    }

    totalRemaining += Math.max(0, s.monthlyQuota - s.usedQuota);
  }

  return { consumed: false, remaining: totalRemaining };
}
