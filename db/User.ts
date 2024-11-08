import mongoose, { Schema } from 'mongoose';
import { DEFAULT_AI_MODEL } from '../src/utils/consts';
import {
  AiModel,
  AiModels,
  SubscriptionLevel,
  SubscriptionLevels,
  SubscriptionDuration,
} from '../src/types/types';
import { SUBSCRIPTIONS } from '../src/bot-subscriptions';

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
  newSubscriptionLevel: SubscriptionLevel | null;
  subscriptionExpiry: Date | null;
  subscriptionDuration: SubscriptionDuration | null;
  unsubscribeReason: string | null;
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
    default: SUBSCRIPTIONS.FREE.basicRequestsPerDay,
    required: true,
  },
  proRequestsBalanceLeftToday: {
    type: Number,
    default: SUBSCRIPTIONS.FREE.proRequestsPerDay,
    required: true,
  },
  imageGenerationBalanceLeftToday: {
    type: Number,
    default: SUBSCRIPTIONS.FREE.imageGenerationPerDay,
    required: true,
  },
  subscriptionLevel: {
    type: String,
    enum: Object.keys(SubscriptionLevels),
    default: SubscriptionLevels.FREE,
    required: true,
  },
  newSubscriptionLevel: {
    type: String,
    enum: Object.keys(SubscriptionLevels),
  },
  subscriptionExpiry: {
    type: Date,
    default: null,
  },
  subscriptionDuration: {
    type: Object,
    default: null,
  },
  unsubscribeReason: {
    type: String,
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
