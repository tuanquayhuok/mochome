export type LoyaltyTierId = 'bronze' | 'silver' | 'gold' | 'diamond' | 'vip' | 'partner' | 'super_loyal';

export interface StoreAddress {
  province: string;
  district: string;
  ward: string;
  street: string;
  zip: string;
}

export interface LoyaltyMilestone {
  id: string;
  label: string;
  period: 'month' | 'year';
  amount: number;
  discountPercent?: number;
  voucherCode: string;
  voucherTitle: string;
  spend: number;
  reached: boolean;
  claimed: boolean;
  canClaim: boolean;
}

export interface LoyaltyInfo {
  tier: LoyaltyTierId;
  tierLabel: string;
  tierColor: string;
  spendMonth: number;
  spendYear: number;
  nextTier: { id: LoyaltyTierId; label: string; minMonth: number; minYear: number } | null;
  progress: {
    monthPercent: number;
    yearPercent: number;
    monthRemaining: number;
    yearRemaining: number;
  };
  tiers: { id: LoyaltyTierId; label: string; color: string }[];
  milestones: LoyaltyMilestone[];
}

export interface StoreProfileUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: StoreAddress;
  loyalty?: LoyaltyInfo;
}
