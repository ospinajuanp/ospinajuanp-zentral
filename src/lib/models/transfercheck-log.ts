import mongoose, { Schema, Document } from 'mongoose';

export interface IPhotoData {
  monto: number;
  referencia: string;
  fecha: string;
}

export interface IEmailData {
  from: string;
  subject: string;
  date: string;
  snippet: string;
  matchedMonto: number;
  matchedReferencia: string;
}

export type TransferCheckStatus = 'pending_email' | 'matched' | 'manual_error';

export interface ITransferCheckLog extends Document {
  workspace: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  photoData: IPhotoData;
  emailData: IEmailData | null;
  status: TransferCheckStatus;
  retryCount: number;
  nextRetryAt: Date | null;
  matchedAt: Date | null;
  resolvedBy: mongoose.Types.ObjectId | null;
  manualData: IPhotoData | null;
  createdAt: Date;
  updatedAt: Date;
}

const photoDataSchema = new Schema<IPhotoData>(
  {
    monto: { type: Number, required: true },
    referencia: { type: String, required: true, trim: true },
    fecha: { type: String, required: true },
  },
  { _id: false }
);

const emailDataSchema = new Schema<IEmailData>(
  {
    from: { type: String, default: '' },
    subject: { type: String, default: '' },
    date: { type: String, default: '' },
    snippet: { type: String, default: '' },
    matchedMonto: { type: Number, default: 0 },
    matchedReferencia: { type: String, default: '' },
  },
  { _id: false }
);

const transferCheckLogSchema = new Schema<ITransferCheckLog>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    photoData: {
      type: photoDataSchema,
      required: true,
    },
    emailData: {
      type: emailDataSchema,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending_email', 'matched', 'manual_error'],
      default: 'pending_email',
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },
    matchedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    manualData: {
      type: photoDataSchema,
      default: null,
    },
  },
  { timestamps: true }
);

transferCheckLogSchema.index({ workspace: 1, status: 1 });
transferCheckLogSchema.index({ status: 1, nextRetryAt: 1 });

export const TransferCheckLog =
  mongoose.models.TransferCheckLog ??
  mongoose.model<ITransferCheckLog>('TransferCheckLog', transferCheckLogSchema);
