export type ConsentCategory = 'purchase' | 'location' | 'identity' | 'browser' | 'financial';

export interface ConsentSetting {
  id: ConsentCategory;
  name: string;
  description: string;
  enabled: boolean;
  rewardWeight: number; // impact on payout rate
}

export interface BrandConsent {
  id: string;
  name: string;
  category: string;
  logo: string;
  enabled: boolean;
  lastAccessed: string;
  dataShared: string[];
}

export interface RewardItem {
  id: string;
  type: 'cashback' | 'points' | 'voucher';
  title: string;
  description: string;
  amount: string;
  status: 'available' | 'claimed' | 'pending';
  provider: string;
  date: string;
}

export interface TransactionLog {
  id: string;
  brandName: string;
  dataProduct: string;
  accessedAt: string;
  purpose: string;
  rewardPaid: string;
  status: 'Authorized' | 'Revoked' | 'Audited';
}

export interface AgentMarketItem {
  id: string;
  name: string;
  description: string;
  provider: string;
  inputs: string[];
  outputs: string[];
  cost: string;
  trustScore: number;
  certifications: string[];
  artfCompatible: boolean;
}

export interface SimulationLog {
  id: string;
  timestamp: string;
  source: string;
  target: string;
  messageType: string;
  content: string;
  color: string;
}
