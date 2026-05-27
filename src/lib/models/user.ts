import mongoose, { Schema, Document } from 'mongoose';
import type { Role } from '@/types';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  workspace?: mongoose.Types.ObjectId | null;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'operador', 'hijo'],
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safe } = ret;
    return safe;
  },
});

userSchema.index({ workspace: 1, createdAt: -1 });

export const User = mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
