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
