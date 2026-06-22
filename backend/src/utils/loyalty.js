const Order = require('../models/Order');

const TIERS = [
  { id: 'bronze', label: 'Đồng', minMonth: 0, minYear: 0, color: '#b45309' },
  { id: 'silver', label: 'Bạc', minMonth: 3_000_000, minYear: 15_000_000, color: '#6b7280' },
  { id: 'gold', label: 'Vàng', minMonth: 8_000_000, minYear: 40_000_000, color: '#ca8a04' },
  { id: 'diamond', label: 'Kim cương', minMonth: 20_000_000, minYear: 100_000_000, color: '#2563eb' },
  { id: 'super_loyal', label: 'Siêu thân thiết', minMonth: 40_000_000, minYear: 200_000_000, color: '#7c3aed' }
];

/** Mốc tháng và mốc năm dùng voucher khác nhau; % tăng dần theo mốc */
const MILESTONES = [
  {
    id: 'month_3m',
    label: 'Mốc tháng — Bạc',
    period: 'month',
    amount: 3_000_000,
    discountPercent: 5,
    voucherCode: 'T5THANG',
    voucherTitle: 'Giảm 5% đơn tháng (tối đa 300K)'
  },
  {
    id: 'month_8m',
    label: 'Mốc tháng — Vàng',
    period: 'month',
    amount: 8_000_000,
    discountPercent: 10,
    voucherCode: 'T10THANG',
    voucherTitle: 'Giảm 10% đơn tháng (tối đa 500K)'
  },
  {
    id: 'month_20m',
    label: 'Mốc tháng — Kim cương',
    period: 'month',
    amount: 20_000_000,
    discountPercent: 15,
    voucherCode: 'T15THANG',
    voucherTitle: 'Giảm 15% đơn tháng (tối đa 800K)'
  },
  {
    id: 'month_vip',
    label: 'Mốc tháng — VIP',
    period: 'month',
    amount: 40_000_000,
    discountPercent: 20,
    voucherCode: 'TVIPTHANG',
    voucherTitle: 'VIP tháng — giảm 20% (tối đa 1.2M)'
  },
  {
    id: 'year_vip',
    label: 'Mốc năm — VIP',
    period: 'year',
    amount: 60_000_000,
    discountPercent: 12,
    voucherCode: 'NVIP',
    voucherTitle: 'VIP năm — giảm 12% (tối đa 800K)'
  },
  {
    id: 'year_partner',
    label: 'Mốc năm — Đối tác',
    period: 'year',
    amount: 120_000_000,
    discountPercent: 18,
    voucherCode: 'NDOITAC',
    voucherTitle: 'Đối tác — giảm 18% (tối đa 1.5M)'
  },
  {
    id: 'year_super',
    label: 'Mốc năm — Siêu thân thiết',
    period: 'year',
    amount: 200_000_000,
    discountPercent: 25,
    voucherCode: 'NSIEUTHAN',
    voucherTitle: 'Siêu thân thiết — giảm 25% (tối đa 2.5M)'
  }
];

const COUNTED_STATUSES = ['processing', 'shipping', 'completed'];

const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfYear = (d = new Date()) => new Date(d.getFullYear(), 0, 1);

const sumSpend = async (userId, since) => {
  const rows = await Order.aggregate([
    {
      $match: {
        user: userId,
        status: { $in: COUNTED_STATUSES },
        createdAt: { $gte: since }
      }
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  return rows[0]?.total || 0;
};

const resolveTier = (spendMonth, spendYear) => {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (spendMonth >= tier.minMonth || spendYear >= tier.minYear) {
      current = tier;
    }
  }
  const idx = TIERS.findIndex((t) => t.id === current.id);
  const next = TIERS[idx + 1] || null;
  return { current, next, idx };
};

const progressToNext = (spendMonth, spendYear, next) => {
  if (!next) {
    return { monthPercent: 100, yearPercent: 100, monthRemaining: 0, yearRemaining: 0 };
  }
  const monthPercent = Math.min(100, Math.round((spendMonth / next.minMonth) * 100));
  const yearPercent = Math.min(100, Math.round((spendYear / next.minYear) * 100));
  return {
    monthPercent,
    yearPercent,
    monthRemaining: Math.max(0, next.minMonth - spendMonth),
    yearRemaining: Math.max(0, next.minYear - spendYear)
  };
};

const buildMilestones = (spendMonth, spendYear, claimed = []) => {
  const claimedSet = new Set(claimed);
  return MILESTONES.map((m) => {
    const spend = m.period === 'month' ? spendMonth : spendYear;
    const reached = spend >= m.amount;
    const claimedAt = claimedSet.has(m.id);
    return {
      ...m,
      spend,
      reached,
      claimed: claimedAt,
      canClaim: reached && !claimedAt
    };
  });
};

const getLoyaltySnapshot = async (user) => {
  const spendMonth = await sumSpend(user._id, startOfMonth());
  const spendYear = await sumSpend(user._id, startOfYear());
  const { current, next } = resolveTier(spendMonth, spendYear);
  const progress = progressToNext(spendMonth, spendYear, next);

  return {
    tier: current.id,
    tierLabel: current.label,
    tierColor: current.color,
    spendMonth,
    spendYear,
    nextTier: next
      ? { id: next.id, label: next.label, minMonth: next.minMonth, minYear: next.minYear }
      : null,
    progress,
    tiers: TIERS.map((t) => ({ id: t.id, label: t.label, color: t.color })),
    milestones: buildMilestones(spendMonth, spendYear, user.claimedMilestones || [])
  };
};

module.exports = {
  TIERS,
  MILESTONES,
  getLoyaltySnapshot
};
