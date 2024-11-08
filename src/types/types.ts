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
  packageName?: PackageName;
  subscriptionLevel?: SubscriptionLevel;
  user?: Pick<IUser, 'telegramId' | 'firstName' | 'userName'>;
}

export type MyContext = HydrateFlavor<
  Context & SessionFlavor<SessionData> & ConversationFlavor
>;
export type MyConversation = Conversation<MyContext>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export enum AiModels {
  GPT_4O_MINI = 'gpt-4o-mini-2024-07-18',
  GPT_4O = 'gpt-4o-2024-08-06',
}

export enum AiModelsLabels {
  GPT_4O_MINI = 'GPT-4o-mini',
  GPT_4O = 'GPT-4o (PRO запросы)',
}

export type AiModel = keyof typeof AiModels;

export enum ImageGenerationQuality {
  STANDARD = 'standard',
  HD = 'hd',
}

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

export enum SubscriptionLevels {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ULTIMATE = 'ULTIMATE',
}

export type SubscriptionLevel = keyof typeof SubscriptionLevels;

export interface SubscriptionData {
  basicRequestsPerDay: number;
  proRequestsPerDay?: number;
  imageGenerationPerDay?: number;
  price: number;
  description: string;
  title: string;
  icon: string;
  duration?: {
    days?: number;
    months?: number;
  };
}

// It's a stringified object of type { days?: number; months?: number }
export type SubscriptionDurationStringified = string;
export type SubscriptionDuration = { days?: number; months?: number };

export interface CancellationDetails {
  party?: string;
  reason?: string;
}
