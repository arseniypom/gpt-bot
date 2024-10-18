// Импорт необходимых модулей и типов
import mongoose, { Document, Schema, Model } from 'mongoose';
import { DEFAULT_AI_MODEL } from '../src/utils/consts';
import { AiModels } from '../src/types/types';

export interface UserDocument extends Document {
  telegramId: number;
  firstName?: string;
  userName?: string;
  basicRequestsBalance: number;
  proRequestsBalance: number;
  imageGenerationBalance: number;
  selectedModel: keyof typeof AiModels;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<UserDocument> = new mongoose.Schema({
  telegramId: { type: Number, unique: true, required: true },
  firstName: { type: String },
  userName: { type: String },
  basicRequestsBalance: {
    type: Number,
    default: 20,
    required: true,
  },
  proRequestsBalance: {
    type: Number,
    default: 5,
    required: true,
  },
  imageGenerationBalance: {
    type: Number,
    default: 3,
    required: true,
  },
  selectedModel: {
    type: String,
    enum: Object.keys(AiModels),
    default: DEFAULT_AI_MODEL,
    required: true,
  },
  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const UserModel: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);

export default UserModel;
