import { LoyaltyInfo, LoyaltyMilestone } from './store-profile.models';
import { LoyaltyIconKey } from './loyalty-tier-icons';

export const MONTH_TRACK_MAX = 40_000_000;
export const YEAR_TRACK_MAX = 200_000_000;

export type MarkerEdge = 'start' | 'end' | 'center';

export interface LoyaltyTrackMarker {
  tierId: string;
  label: string;
  color: string;
  iconKey: LoyaltyIconKey;
  percent: number;
  amount: number;
  milestoneId: string;
  discountPercent: number;
  voucherTitle: string;
  voucherCode: string;
  reached: boolean;
  claimed: boolean;
  canClaim: boolean;
  edge: MarkerEdge;
}

interface MarkerDef {
  tierId: string;
  label: string;
  amount: number;
  color: string;
  iconKey: LoyaltyIconKey;
  milestoneId: string;
  discountPercent: number;
  edge?: MarkerEdge;
}

const MONTH_MARKER_DEFS: MarkerDef[] = [
  { tierId: 'bronze', label: 'Đồng', amount: 0, color: '#b45309', iconKey: 'bronze', milestoneId: '', discountPercent: 0, edge: 'start' },
  { tierId: 'silver', label: 'Bạc', amount: 3_000_000, color: '#6b7280', iconKey: 'silver', milestoneId: 'month_3m', discountPercent: 5 },
  { tierId: 'gold', label: 'Vàng', amount: 8_000_000, color: '#ca8a04', iconKey: 'gold', milestoneId: 'month_8m', discountPercent: 10 },
  { tierId: 'diamond', label: 'Kim cương', amount: 20_000_000, color: '#2563eb', iconKey: 'diamond', milestoneId: 'month_20m', discountPercent: 15 },
  { tierId: 'vip', label: 'VIP', amount: 40_000_000, color: '#7c3aed', iconKey: 'vip', milestoneId: 'month_vip', discountPercent: 20, edge: 'end' }
];

/** Chỉ 3 mốc: VIP → Đối tác → Siêu thân thiết */
const YEAR_MARKER_DEFS: MarkerDef[] = [
  { tierId: 'vip', label: 'VIP', amount: 60_000_000, color: '#7c3aed', iconKey: 'vip', milestoneId: 'year_vip', discountPercent: 12 },
  { tierId: 'partner', label: 'Đối tác', amount: 120_000_000, color: '#0d9488', iconKey: 'partner', milestoneId: 'year_partner', discountPercent: 18 },
  {
    tierId: 'super_loyal',
    label: 'Siêu thân thiết',
    amount: 200_000_000,
    color: '#dc2626',
    iconKey: 'super',
    milestoneId: 'year_super',
    discountPercent: 25,
    edge: 'end'
  }
];

const milestoneMap = (list: LoyaltyMilestone[]) => new Map(list.map((m) => [m.id, m]));

const resolveEdge = (d: MarkerDef, index: number, total: number): MarkerEdge => {
  if (d.edge) return d.edge;
  if (index === 0) return 'start';
  if (index === total - 1) return 'end';
  return 'center';
};

const buildMarkers = (defs: MarkerDef[], max: number, milestones: LoyaltyMilestone[]): LoyaltyTrackMarker[] => {
  const map = milestoneMap(milestones);
  return defs.map((d, i) => {
    const ms = d.milestoneId ? map.get(d.milestoneId) : undefined;
    return {
      tierId: d.tierId,
      label: d.label,
      color: d.color,
      iconKey: d.iconKey,
      percent: Math.min(100, (d.amount / max) * 100),
      amount: d.amount,
      milestoneId: d.milestoneId,
      discountPercent: ms?.discountPercent ?? d.discountPercent,
      voucherTitle: ms?.voucherTitle || (d.amount === 0 ? 'Bắt đầu hành trình' : '—'),
      voucherCode: ms?.voucherCode || '—',
      reached: d.amount === 0 ? true : Boolean(ms?.reached),
      claimed: Boolean(ms?.claimed),
      canClaim: Boolean(ms?.canClaim),
      edge: resolveEdge(d, i, defs.length)
    };
  });
};

export function monthTrackMarkers(L: LoyaltyInfo): LoyaltyTrackMarker[] {
  return buildMarkers(MONTH_MARKER_DEFS, MONTH_TRACK_MAX, L.milestones);
}

export function yearTrackMarkers(L: LoyaltyInfo): LoyaltyTrackMarker[] {
  return buildMarkers(YEAR_MARKER_DEFS, YEAR_TRACK_MAX, L.milestones);
}

export function spendPercent(spend: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((spend / max) * 100));
}

export function markerPositionClass(edge: MarkerEdge): string {
  if (edge === 'start') return 'track-marker--start';
  if (edge === 'end') return 'track-marker--end';
  return '';
}
