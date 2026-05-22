export type Role = 'superadmin' | 'admin' | 'hijo';

export type ModuleTier = 'free' | 'premium';

export type ModuleStatus = 'active' | 'inactive' | 'suspended';

export type BillingPeriod = 'monthly' | 'yearly' | 'one_time';

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  role: Role;
  workspace?: string | null;
  isActive: boolean;
}

export interface ModuleInfo {
  _id: string;
  key: string;
  name: string;
  description: string;
  tier: ModuleTier;
  status: 'active' | 'inactive' | 'coming_soon';
  defaultQuota: number;
  icon?: string;
}
