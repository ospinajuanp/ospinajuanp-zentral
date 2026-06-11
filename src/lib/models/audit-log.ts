import mongoose, { Schema, Document } from 'mongoose';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'activate'
  | 'deactivate'
  | 'login'
  | 'logout';

export type AuditEntity =
  | 'User'
  | 'Workspace'
  | 'Plan'
  | 'Module'
  | 'ModuleSubscription'
  | 'AppSettings';

export interface IAuditLog extends Document {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userRole: string;
  workspaceId?: mongoose.Types.ObjectId | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'activate', 'deactivate', 'login', 'logout'],
      required: true,
      index: true,
    },
    entity: {
      type: String,
      enum: ['User', 'Workspace', 'Plan', 'Module', 'ModuleSubscription', 'AppSettings'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog ?? mongoose.model<IAuditLog>('AuditLog', auditLogSchema);