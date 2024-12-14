import OpenAI from 'openai';
import 'dotenv/config';
import fs from 'fs';
import { Document, Types } from 'mongoose';
import { Message } from 'grammy/types';
import { MessageXFragment } from '@grammyjs/hydrate/out/data/message';
import { IUser } from '../../db/User';
import { IMessage } from '../../db/Message';
import {
  AiModel,
  AiModels,
  AiRequestMode,
  ChatMode,
  ImageGenerationQuality,
  SubscriptionLevels,
} from '../types/types';
import { isValidAiModel } from '../types/typeguards';
import {
  DEFAULT_AI_MODEL,
  PROMPT_MESSAGE_BASE,
  PROMPT_MESSAGE_DIALOG_MODE_POSTFIX,
  PROMPT_MESSAGE_BASIC_MODE_POSTFIX,
  BASIC_REQUEST_COST,
  getNoBalanceMessage,
  PRO_REQUEST_COST,
  VOICE_ADDITIONAL_COST,
} from './consts';
import { getTopupAndChangeModelKeyboard } from '../commands/topup';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getResponseFromOpenAIGpt = async ({
  chatHistory,
  telegramId,
  chatMode,
  modelName = DEFAULT_AI_MODEL,
}: {
  chatHistory: IMessage[];
  telegramId: number;
  chatMode: ChatMode;
  modelName?: AiModel;
}): Promise<string | null> => {
  const formattedHistoryMessages = chatHistory.map((msg) => ({
    role: msg.role as 'system' | 'user' | 'assistant',
    content: [{ type: 'text', text: msg.content }] as [
      { type: 'text'; text: string },
    ],
  }));

  if (!isValidAiModel(modelName)) {
    throw new Error('Invalid model name');
  }

  let prompt = PROMPT_MESSAGE_BASE;
  switch (chatMode) {
    case 'dialogue':
      prompt += PROMPT_MESSAGE_DIALOG_MODE_POSTFIX;
      break;
    case 'basic':
      prompt += PROMPT_MESSAGE_BASIC_MODE_POSTFIX;
      break;
    default:
      break;
  }

  try {
    const response = await openai.chat.completions.create({
      model: AiModels[modelName],
      messages: [
        { role: 'system', content: [{ type: 'text', text: prompt }] },
        ...formattedHistoryMessages,
      ],
      user: telegramId.toString(),
    });

    return response.choices[0].message.content;
  } catch (error) {
    const err = error as Error;
    throw err;
  }
};

export const generateImage = async (
  prompt: string,
  quality: ImageGenerationQuality = ImageGenerationQuality.STANDARD,
): Promise<{ url?: string; revisedPrompt?: string }> => {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    quality: quality,
    prompt,
    n: 1,
    size: '1024x1024',
  });

  return {
    url: response.data[0].url,
    revisedPrompt: response.data[0].revised_prompt,
  };
};

export const transcribeVoice = async (path: string): Promise<string> => {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(path),
    model: 'whisper-1',
  });

  return transcription.text;
};

export const checkUserHasSufficientBalance = async ({
  user,
  responseMessage,
  mode,
}: {
  user: Document<unknown, {}, IUser> &
    IUser & {
      _id: Types.ObjectId;
    } & {
      __v: number;
    };
  responseMessage: Message.CommonMessage & MessageXFragment;
  mode: AiRequestMode;
}) => {
  let hasSufficientBalance = true;

  switch (mode) {
    case 'voice':
      if (AiModels[user.selectedModel] === AiModels.GPT_4O) {
        if (
          user.proRequestsLeftThisMonth === 0 &&
          user.tokensBalance - PRO_REQUEST_COST + VOICE_ADDITIONAL_COST < 0
        ) {
          await responseMessage.editText(
            getNoBalanceMessage({
              reqType: user.selectedModel,
              canActivateTrial: user.canActivateTrial,
              isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
              mode,
            }),
            {
              reply_markup: getTopupAndChangeModelKeyboard(
                user.subscriptionLevel,
              ),
              parse_mode: 'MarkdownV2',
            },
          );
          hasSufficientBalance = false;
        }
      } else if (AiModels[user.selectedModel] === AiModels.GPT_4O_MINI) {
        if (
          user.basicRequestsLeftToday === 0 &&
          user.tokensBalance - BASIC_REQUEST_COST + VOICE_ADDITIONAL_COST < 0
        ) {
          await responseMessage.editText(
            getNoBalanceMessage({
              reqType: user.selectedModel,
              canActivateTrial: user.canActivateTrial,
              isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
              mode,
            }),
            {
              reply_markup: getTopupAndChangeModelKeyboard(
                user.subscriptionLevel,
              ),
              parse_mode: 'MarkdownV2',
            },
          );
          hasSufficientBalance = false;
        }
      } else {
        throw new Error('Invalid model: ' + user.selectedModel);
      }
      break;

    case 'text':
      if (AiModels[user.selectedModel] === AiModels.GPT_4O) {
        if (
          user.proRequestsLeftThisMonth === 0 &&
          user.tokensBalance - PRO_REQUEST_COST < 0
        ) {
          await responseMessage.editText(
            getNoBalanceMessage({
              reqType: user.selectedModel,
              canActivateTrial: user.canActivateTrial,
              isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
              mode,
            }),
            {
              reply_markup: getTopupAndChangeModelKeyboard(
                user.subscriptionLevel,
              ),
              parse_mode: 'MarkdownV2',
            },
          );
          hasSufficientBalance = false;
        }
      } else if (AiModels[user.selectedModel] === AiModels.GPT_4O_MINI) {
        if (
          user.basicRequestsLeftThisWeek === 0 &&
          user.basicRequestsLeftToday === 0 &&
          user.tokensBalance - BASIC_REQUEST_COST < 0
        ) {
          await responseMessage.editText(
            getNoBalanceMessage({
              reqType: user.selectedModel,
              canActivateTrial: user.canActivateTrial,
              isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
              mode,
            }),
            {
              reply_markup: getTopupAndChangeModelKeyboard(
                user.subscriptionLevel,
              ),
              parse_mode: 'MarkdownV2',
            },
          );
          hasSufficientBalance = false;
        }
      } else {
        throw new Error('Invalid model: ' + user.selectedModel);
      }
      break;
    default:
      break;
  }

  return hasSufficientBalance;
};
