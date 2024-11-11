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
import dayjs from 'dayjs';

export interface IUser {
  telegramId: number;
  firstName?: string;
  userName?: string;
  basicRequestsBalance: number;
  proRequestsBalance: number;
  imageGenerationBalance: number;
  selectedModel: AiModel;
  basicRequestsLeftThisWeek: number;
  basicRequestsLeftToday: number;
  proRequestsLeftThisMonths: number;
  imageGenerationLeftThisMonths: number;
  subscriptionLevel: SubscriptionLevel;
  newSubscriptionLevel: SubscriptionLevel | null;
  subscriptionExpiry: Date | null;
  weeklyRequestsExpiry: Date | null;
  subscriptionDuration: SubscriptionDuration | null;
  unsubscribeReason: string | null;
  lastUnsubscribeDate: Date | null;
  yookassaPaymentMethodId: string | null;
  tokensBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  telegramId: { type: Number, unique: true, required: true },
  firstName: { type: String },
  userName: { type: String },
  basicRequestsBalance: {
    type: Number,
    default: 0,
  },
  proRequestsBalance: {
    type: Number,
    default: 0,
  },
  imageGenerationBalance: {
    type: Number,
    default: 0,
  },
  selectedModel: {
    type: String,
    enum: Object.keys(AiModels),
    default: DEFAULT_AI_MODEL,
    required: true,
  },
  basicRequestsLeftThisWeek: {
    type: Number,
    default: SUBSCRIPTIONS.FREE.basicRequestsPerWeek,
    required: true,
  },
  basicRequestsLeftToday: {
    type: Number,
    default: 0,
    required: true,
  },
  proRequestsLeftThisMonths: {
    type: Number,
    default: 0,
    required: true,
  },
  imageGenerationLeftThisMonths: {
    type: Number,
    default: 0,
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
  weeklyRequestsExpiry: {
    type: Date,
    default: () => dayjs().add(7, 'day').toDate(),
  },
  subscriptionDuration: {
    type: Object,
    default: null,
  },
  unsubscribeReason: {
    type: String,
    default: null,
  },
  lastUnsubscribeDate: {
    type: Date,
    default: null,
  },
  yookassaPaymentMethodId: {
    type: String,
    default: null,
  },
  tokensBalance: {
    type: Number,
    default: 0,
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
