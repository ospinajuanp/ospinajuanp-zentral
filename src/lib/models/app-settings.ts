import mongoose, { Document, Schema, Model } from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

export interface IAppSettings extends Document {
  registrationEnabled: boolean;
  loginEnabled: boolean;
  emailVerificationRequired: boolean;
  passwordResetEnabled: boolean;
  transactionalEmailsEnabled: boolean;
  simulatedPurchaseEnabled: boolean;
  transferCheckEnabled: boolean;
  personalFinanceEnabled: boolean;
  gmailOAuthEnabled: boolean;
  publicPlansApiEnabled: boolean;
  debugEndpointsEnabled: boolean;
  workspacesEnabled: boolean;
  modulesEnabled: boolean;
  plansEnabled: boolean;
  usersEnabled: boolean;
  moduleAccessEnabled: boolean;
  adminUsersEnabled: boolean;
  adminPlansEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const appSettingsSchema = new Schema<IAppSettings>(
  {
    registrationEnabled: { type: Boolean, default: true },
    loginEnabled: { type: Boolean, default: true },
    emailVerificationRequired: { type: Boolean, default: true },
    passwordResetEnabled: { type: Boolean, default: true },
    transactionalEmailsEnabled: { type: Boolean, default: true },
    simulatedPurchaseEnabled: { type: Boolean, default: true },
    transferCheckEnabled: { type: Boolean, default: true },
    personalFinanceEnabled: { type: Boolean, default: true },
    gmailOAuthEnabled: { type: Boolean, default: true },
    publicPlansApiEnabled: { type: Boolean, default: true },
    debugEndpointsEnabled: { type: Boolean, default: false },
    workspacesEnabled: { type: Boolean, default: true },
    modulesEnabled: { type: Boolean, default: true },
    plansEnabled: { type: Boolean, default: true },
    usersEnabled: { type: Boolean, default: true },
    moduleAccessEnabled: { type: Boolean, default: true },
    adminUsersEnabled: { type: Boolean, default: true },
    adminPlansEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      default: 'Zentral esta en mantenimiento. Volveremos pronto.',
    },
  },
  { timestamps: true },
);

export const AppSettings: Model<IAppSettings> =
  (mongoose.models.AppSettings as Model<IAppSettings>) ||
  mongoose.model<IAppSettings>('AppSettings', appSettingsSchema);

let _cached: IAppSettings | null = null;
let _cachedAt = 0;
const CACHE_TTL = 10_000;

export async function getAppSettings(): Promise<IAppSettings> {
  const now = Date.now();
  if (_cached && now - _cachedAt < CACHE_TTL) return _cached;

  await dbConnect();
  let settings = await AppSettings.findOne().lean();
  if (!settings) {
    const created = await AppSettings.create({});
    settings = created.toJSON();
  }

  _cached = settings as unknown as IAppSettings;
  _cachedAt = now;
  return _cached as unknown as IAppSettings;
}

export function clearSettingsCache(): void {
  _cached = null;
  _cachedAt = 0;
}
