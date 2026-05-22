import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.JWT_SECRET || 'default-key-change-me';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export interface IWorkspaceSettings extends Document {
  workspace: mongoose.Types.ObjectId;
  gmailRefreshToken: string | null;
  gmailAccessToken: string | null;
  gmailTokenExpiry: Date | null;
  gmailConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSettingsSchema = new Schema<IWorkspaceSettings>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      unique: true,
      index: true,
    },
    gmailRefreshToken: {
      type: String,
      default: null,
      set: (v: string | null) => (v ? encrypt(v) : null),
      get: (v: string | null) => (v ? decrypt(v) : null),
    },
    gmailAccessToken: {
      type: String,
      default: null,
    },
    gmailTokenExpiry: {
      type: Date,
      default: null,
    },
    gmailConnected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

export const WorkspaceSettings =
  mongoose.models.WorkspaceSettings ??
  mongoose.model<IWorkspaceSettings>('WorkspaceSettings', workspaceSettingsSchema);

export async function getGmailRefreshToken(workspaceId: string): Promise<string | null> {
  await import('@/lib/db/mongoose').then((m) => m.default());
  const settings = await WorkspaceSettings.findOne({ workspace: workspaceId });
  return settings?.gmailRefreshToken ?? null;
}

export async function setGmailTokens(
  workspaceId: string,
  refreshToken: string,
  accessToken: string,
  expiryDate: Date
): Promise<void> {
  await import('@/lib/db/mongoose').then((m) => m.default());
  await WorkspaceSettings.findOneAndUpdate(
    { workspace: workspaceId },
    {
      gmailRefreshToken: refreshToken,
      gmailAccessToken: accessToken,
      gmailTokenExpiry: expiryDate,
      gmailConnected: true,
    },
    { upsert: true, new: true }
  );
}

export async function disconnectGmail(workspaceId: string): Promise<void> {
  await import('@/lib/db/mongoose').then((m) => m.default());
  await WorkspaceSettings.findOneAndUpdate(
    { workspace: workspaceId },
    {
      gmailRefreshToken: null,
      gmailAccessToken: null,
      gmailTokenExpiry: null,
      gmailConnected: false,
    }
  );
}
