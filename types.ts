import { Context } from 'grammy';
import { HydrateFlavor } from '@grammyjs/hydrate';
import { SessionFlavor } from 'grammy';

export interface SessionData {
  chatId?: string;
}

export type MyContext = HydrateFlavor<Context & SessionFlavor<SessionData>>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

