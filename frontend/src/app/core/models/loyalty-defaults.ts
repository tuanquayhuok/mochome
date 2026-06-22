import { LoyaltyInfo } from './store-profile.models';

export function createDefaultLoyalty(): LoyaltyInfo {
  const monthMs = (
    id: string,
    label: string,
    amount: number,
    discountPercent: number,
    code: string,
    title: string
  ) => ({
    id,
    label,
    period: 'month' as const,
    amount,
    discountPercent,
    voucherCode: code,
    voucherTitle: title,
    spend: 0,
    reached: false,
    claimed: false,
    canClaim: false
  });
  const yearMs = (
    id: string,
    label: string,
    amount: number,
    discountPercent: number,
    code: string,
    title: string
  ) => ({
    id,
    label,
    period: 'year' as const,
    amount,
    discountPercent,
    voucherCode: code,
    voucherTitle: title,
    spend: 0,
    reached: false,
    claimed: false,
    canClaim: false
  });

  return {
    tier: 'bronze',
    tierLabel: 'Đồng',
    tierColor: '#b45309',
    spendMonth: 0,
    spendYear: 0,
    nextTier: { id: 'silver', label: 'Bạc', minMonth: 3_000_000, minYear: 60_000_000 },
    progress: {
      monthPercent: 0,
      yearPercent: 0,
      monthRemaining: 3_000_000,
      yearRemaining: 60_000_000
    },
    tiers: [
      { id: 'bronze', label: 'Đồng', color: '#b45309' },
      { id: 'silver', label: 'Bạc', color: '#6b7280' },
      { id: 'gold', label: 'Vàng', color: '#ca8a04' },
      { id: 'diamond', label: 'Kim cương', color: '#2563eb' },
      { id: 'vip', label: 'VIP', color: '#7c3aed' }
    ],
    milestones: [
      monthMs('month_3m', 'Mốc tháng — Bạc', 3_000_000, 5, 'T5THANG', 'Giảm 5% đơn tháng (tối đa 300K)'),
      monthMs('month_8m', 'Mốc tháng — Vàng', 8_000_000, 10, 'T10THANG', 'Giảm 10% đơn tháng (tối đa 500K)'),
      monthMs('month_20m', 'Mốc tháng — Kim cương', 20_000_000, 15, 'T15THANG', 'Giảm 15% đơn tháng (tối đa 800K)'),
      monthMs('month_vip', 'Mốc tháng — VIP', 40_000_000, 20, 'TVIPTHANG', 'VIP tháng — giảm 20% (tối đa 1.2M)'),
      yearMs('year_vip', 'Mốc năm — VIP', 60_000_000, 12, 'NVIP', 'VIP năm — giảm 12% (tối đa 800K)'),
      yearMs('year_partner', 'Mốc năm — Đối tác', 120_000_000, 18, 'NDOITAC', 'Đối tác — giảm 18% (tối đa 1.5M)'),
      yearMs('year_super', 'Mốc năm — Siêu thân thiết', 200_000_000, 25, 'NSIEUTHAN', 'Siêu thân thiết — giảm 25% (tối đa 2.5M)')
    ]
  };
}
