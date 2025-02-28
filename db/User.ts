import mongoose, { Schema } from 'mongoose';
import { DEFAULT_AI_MODEL } from '../src/utils/consts';
import {
  AiModel,
  AiModels,
  SubscriptionLevel,
  SubscriptionLevels,
  SubscriptionDuration,
  ChatMode,
  UserStage,
  UserStages,
  ReferralProgram,
  UserStats,
  AssistantRole,
} from '../src/types/types';
import { SUBSCRIPTIONS } from '../src/bot-subscriptions';
import dayjs from 'dayjs';

export interface IUser {
  telegramId: number;
  firstName?: string;
  userName?: string;
  email?: string;
  selectedModel: AiModel;
  chatMode: ChatMode;
  assistantRole: AssistantRole;
  basicRequestsLeftThisWeek: number;
  basicRequestsLeftToday: number;
  proRequestsLeftThisMonth: number;
  imageGenerationLeftThisMonth: number;
  canActivateTrial: boolean;
  subscriptionLevel: SubscriptionLevel;
  newSubscriptionLevel: SubscriptionLevel | null;
  subscriptionExpiry: Date | null;
  weeklyRequestsExpiry: Date | null;
  subscriptionDuration: SubscriptionDuration | null;
  unsubscribeReason: string | null;
  lastUnsubscribeDate: Date | null;
  yookassaPaymentMethodId: string | null;
  tokensBalance: number;
  userStage: UserStage;
  isBlockedBot: boolean;
  stats: UserStats;
  referralProgram: ReferralProgram;
  adCampaignCode: string | null;
  usedPromocodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  telegramId: { type: Number, unique: true, required: true },
  firstName: { type: String },
  userName: { type: String },
  email: { type: String },
  selectedModel: {
    type: String,
    enum: Object.keys(AiModels),
    default: DEFAULT_AI_MODEL,
    required: true,
  },
  chatMode: {
    type: String,
    default: 'dialogue',
  },
  assistantRole: {
    type: String,
    default: 'general',
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
  proRequestsLeftThisMonth: {
    type: Number,
    default: 0,
    required: true,
  },
  imageGenerationLeftThisMonth: {
    type: Number,
    default: 0,
    required: true,
  },
  canActivateTrial: {
    type: Boolean,
    default: true,
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
  userStage: {
    type: String,
    default: UserStages.REGISTERED,
  },
  isBlockedBot: {
    type: Boolean,
    default: false,
  },
  stats: {
    type: Object,
    default: {
      basicReqsMade: 0,
      proReqsMade: 0,
      imgGensMade: 0,
    },
  },
  referralProgram: {
    invitedBy: {
      type: Number,
      default: null,
    },
    invitedUserIds: {
      type: [Number],
      default: [],
    },
  },
  adCampaignCode: {
    type: String,
  },
  usedPromocodes: {
    type: [String],
    default: [],
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
