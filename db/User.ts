import mongoose, { Schema } from 'mongoose';
import { DEFAULT_AI_MODEL } from '../src/utils/consts';
import {
  AiModel,
  AiModels,
  SubscriptionLevel,
  SubscriptionLevels,
  SubscriptionDuration,
} from '../src/types/types';

export interface IUser {
  telegramId: number;
  firstName?: string;
  userName?: string;
  basicRequestsBalance: number;
  proRequestsBalance: number;
  imageGenerationBalance: number;
  selectedModel: AiModel;
  basicRequestsBalanceLeftToday: number;
  proRequestsBalanceLeftToday: number;
  imageGenerationBalanceLeftToday: number;
  subscriptionLevel: SubscriptionLevel;
  subscriptionExpiry: Date | null;
  subscriptionDuration?: SubscriptionDuration;
  yookassaPaymentMethodId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  telegramId: { type: Number, unique: true, required: true },
  firstName: { type: String },
  userName: { type: String },
  basicRequestsBalance: {
    type: Number,
    default: 15,
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
  basicRequestsBalanceLeftToday: {
    type: Number,
    default: 15,
    required: true,
  },
  proRequestsBalanceLeftToday: {
    type: Number,
    default: 5,
    required: true,
  },
  imageGenerationBalanceLeftToday: {
    type: Number,
    default: 3,
    required: true,
  },
  subscriptionLevel: {
    type: String,
    enum: Object.keys(SubscriptionLevels),
    default: SubscriptionLevels.FREE,
    required: true,
  },
  subscriptionExpiry: {
    type: Date,
    default: null,
  },
  subscriptionDuration: {
    type: Object,
    default: null,
  },
  yookassaPaymentMethodId: {
    type: String,
    default: null,
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

export default mongoose.model<IUser>('user', userSchema);
