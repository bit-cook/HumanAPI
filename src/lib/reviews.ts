import { prisma } from '@/lib/db'

/**
 * 重算某用户的评分与评价数。以 Review 表为唯一事实来源，
 * 避免 User.rating 与明细漂移（旧数据修复也可直接调用）。
 */
export async function recalculateUserRating(
  userId: string
): Promise<{ rating: number; totalReviews: number }> {
  const aggregate = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: { _all: true },
  })

  const totalReviews = aggregate._count._all
  const rating =
    totalReviews === 0 ? 5.0 : Math.round((aggregate._avg.rating ?? 5) * 100) / 100

  await prisma.user.update({
    where: { id: userId },
    data: { rating, totalReviews },
  })

  return { rating, totalReviews }
}
