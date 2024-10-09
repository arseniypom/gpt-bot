import { Context, type SessionFlavor } from 'grammy';
import { HydrateFlavor } from '@grammyjs/hydrate';
import {
  type Conversation,
  type ConversationFlavor,
} from "@grammyjs/conversations";

export interface SessionData {
  chatId?: string;
  imageQuality: ImageGenerationQuality;
}

export type MyContext = HydrateFlavor<Context & SessionFlavor<SessionData> & ConversationFlavor>;
export type MyConversation = Conversation<MyContext>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export enum AiModels {
  GPT_3_5_TURBO = 'gpt-3.5-turbo-0125',
  GPT_4O = 'gpt-4o-2024-08-06',
  GPT_4O_MINI = 'gpt-4o-mini-2024-07-18',
}

export enum AiModelsLabels {
  GPT_3_5_TURBO = 'GPT-3.5 Turbo',
  GPT_4O = 'GPT-4o',
  GPT_4O_MINI = 'GPT-4o-mini',
}

export enum ImageGenerationQuality {
  STANDARD = 'standard',
  HD = 'hd',
}

