import { Context, type SessionFlavor } from 'grammy';
import { HydrateFlavor } from '@grammyjs/hydrate';
import {
  type Conversation,
  type ConversationFlavor,
} from '@grammyjs/conversations';
import { IUser } from '../../db/User';

export interface SessionData {
  chatId?: string;
  imageQuality: ImageGenerationQuality;
  packageName?: TokenPackageName;
  subscriptionLevel?: Exclude<SubscriptionLevel, 'FREE'>;
  user?: Pick<IUser, 'telegramId' | 'firstName' | 'userName'>;
}

export type MyContext = HydrateFlavor<
  Context & SessionFlavor<SessionData> & ConversationFlavor
>;
export type MyConversation = Conversation<MyContext>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string;
}

export type ChatMode = 'basic' | 'dialogue';

export enum ChatModeLabel {
  basic = 'Обычный',
  dialogue = 'Диалог',
}

export type AssistantRole = 'general' | 'translator';

export enum AssistantRoleLabels {
  general = 'Обычный',
  translator = 'Переводчик',
}

export enum AiModels {
  GPT_4O_MINI = 'gpt-4o-mini-2024-07-18',
  GPT_4O = 'gpt-4o-2024-11-20',
  O1 = 'o1-mini-2024-09-12',
}

export enum AiModelsLabels {
  GPT_4O_MINI = 'GPT-4o-mini',
  GPT_4O = 'GPT-4o',
  O1 = 'o1 (NEW)',
}

export type AiModel = keyof typeof AiModels;
export type AiModelLabel = keyof typeof AiModelsLabels;

export enum ImageGenerationQuality {
  STANDARD = 'Standard',
  HD = 'HD',
}

type DallEQualityParam = 'standard' | 'hd';
export const imageQualityMap: Record<
  ImageGenerationQuality,
  DallEQualityParam
> = {
  [ImageGenerationQuality.STANDARD]: 'standard',
  [ImageGenerationQuality.HD]: 'hd',
};

export enum ImageGenerationSizes {
  SQUARE = '1024x1024',
  VERTICAL = '1024x1792',
  HORIZONTAL = '1792x1024',
}

export type AiRequestMode = 'text' | 'voice' | 'imageVision';

export type PackageName =
  | 'req1'
  | 'req2'
  | 'req3'
  | 'img1'
  | 'img2'
  | 'img3'
  | 'combo1'
  | 'combo2'
  | 'combo3';

export interface PackageData {
  basicRequestsBalance?: number;
  proRequestsBalance?: number;
  imageGenerationBalance?: number;
  price: number;
  description: string;
  title: string;
  numberIcon: string;
}

export type TokenPackageName = 'token1' | 'token2' | 'token3';

export interface TokenPackageData {
  tokensNumber: number;
  price: number;
  description: string;
  title: string;
}

export enum SubscriptionLevels {
  FREE = 'FREE',
  START = 'START',
  OPTIMUM = 'OPTIMUM',
  PREMIUM = 'PREMIUM',
  ULTRA = 'ULTRA',
  OPTIMUM_TRIAL = 'OPTIMUM_TRIAL',
}

export type SubscriptionLevel = keyof typeof SubscriptionLevels;

export interface SubscriptionData {
  basicRequestsPerWeek?: number;
  basicRequestsPerDay?: number;
  proRequestsPerMonth?: number;
  imageGenerationPerMonth?: number;
  price: number;
  description: string;
  title: string;
  icon: string;
  duration?: {
    days?: number;
    months?: number;
  };
}

export type SubscriptionDuration = { days?: number; months?: number };

export interface CancellationDetails {
  party?: string;
  reason?: string;
}

export enum UserStages {
  REGISTERED = 'registered',
  SUBSCRIBED_TO_CHANNEL = 'subscribedToChannel',
  USED_FREE_REQUESTS = 'usedFreeRequests',
  BOUGHT_SUBSCRIPTION = 'boughtSubscription',
}
export type UserStage =
  | 'registered'
  | 'subscribedToChannel'
  | 'usedFreeRequests'
  | 'boughtSubscription';

export type HelpMessage =
  | 'helpFindMenu'
  | 'helpHowToUseBot'
  | 'helpRequests'
  | 'helpModels'
  | 'helpTokens'
  | 'helpSubscription'
  | 'helpChatModes';

export interface ReferralProgram {
  invitedBy: number | null;
  invitedUserIds: number[];
}

export interface UserStats {
  basicReqsMade: number;
  proReqsMade: number;
  o1ReqsMade: number;
  imgGensMade: number;
}
