import telegramifyMarkdown from 'telegramify-markdown';
import OpenAI from 'openai';
import 'dotenv/config';
import fs from 'fs';
import { Document, Types } from 'mongoose';
import { Message as TelegramMessage } from '@grammyjs/types';
import { MessageXFragment } from '@grammyjs/hydrate/out/data/message';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { IUser } from '../../db/User';
import Message, { IMessage } from '../../db/Message';
import {
  AiModel,
  AiModels,
  AssistantRole,
  ImageGenerationQuality,
  ImageGenerationSizes,
  imageQualityMap,
  MyContext,
  SubscriptionLevels,
} from '../types/types';
import { isValidAiModel } from '../types/typeguards';
import {
  DEFAULT_AI_MODEL,
  PROMPT_MESSAGE_BASE,
  PROMPT_MESSAGE_DIALOG_MODE_POSTFIX,
  PROMPT_FOR_TRANSLATOR,
  getNoBalanceMessage,
  VOICE_ADDITIONAL_COST,
  MAX_HISTORY_LENGTH_START_OPTIMUM,
  MAX_HISTORY_LENGTH_PREMIUM_ULTRA,
  MAX_HISTORY_LENGTH_FREE,
  getPromptImagePostfix,
  IMAGE_ANALYSIS_COST,
  modelSettings,
} from './consts';
import { getTopupAndChangeModelKeyboard } from '../commands/topup';
import Chat from '../../db/Chat';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getResponseFromOpenAIGpt = async ({
  chatHistory,
  telegramId,
  assistantRole,
  modelName = DEFAULT_AI_MODEL,
}: {
  chatHistory: IMessage[];
  telegramId: number;
  assistantRole: AssistantRole;
  modelName?: AiModel;
}): Promise<string | null> => {
  let formattedHistoryMessages: ChatCompletionMessageParam[] = [];

  chatHistory.forEach((msg) => {
    const content: ChatCompletionMessageParam['content'] = [
      { type: 'text', text: msg.content },
    ];
    if (msg.imageData) {
      content.push({
        // TODO: fix type error
        // @ts-ignore
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${msg.imageData.toString('base64')}`,
        },
      });
    }
    // TODO: fix type error
    // @ts-ignore
    formattedHistoryMessages.push({
      role: msg.role,
      content,
    });
  });

  if (!isValidAiModel(modelName)) {
    throw new Error('Invalid model name');
  }

  let prompt;
  switch (assistantRole) {
    case 'translator':
      prompt = PROMPT_FOR_TRANSLATOR;
      break;
    default:
      prompt = PROMPT_MESSAGE_BASE + PROMPT_MESSAGE_DIALOG_MODE_POSTFIX;
      break;
  }

  try {
    const messages: ChatCompletionMessageParam[] = [];
    if (AiModels[modelName] === AiModels.O1) {
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      });
    } else {
      messages.push({
        role: 'system',
        content: [{ type: 'text', text: prompt }],
      });
    }
    messages.push(...formattedHistoryMessages);

    const response = await openai.chat.completions.create({
      model: AiModels[modelName],
      messages,
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
  size: ImageGenerationSizes = ImageGenerationSizes.SQUARE,
): Promise<{ url?: string; revisedPrompt?: string }> => {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    quality: imageQualityMap[quality],
    prompt,
    n: 1,
    size,
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

export const getVisionResponseFromOpenAIGpt = async ({
  imageUrl,
  telegramId,
  caption,
}: {
  imageUrl: string;
  telegramId: number;
  caption?: string;
}) => {
  const prompt = PROMPT_MESSAGE_BASE + getPromptImagePostfix(caption);
  try {
    const response = await openai.chat.completions.create({
      model: AiModels.GPT_4O,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    const err = error as Error;
    throw err;
  }
};

export const checkUserHasSufficientBalance = async ({
  user,
  responseMessage,
  mode,
}: {
  user: Document<unknown, {}, IUser> &
    IUser & { _id: Types.ObjectId } & { __v: number };
  responseMessage: TelegramMessage.CommonMessage & MessageXFragment;
  mode: 'voice' | 'text' | 'imageVision';
}) => {
  if (mode === 'imageVision') {
    if (
      (user.subscriptionLevel === SubscriptionLevels.FREE ||
        user.subscriptionLevel === SubscriptionLevels.START) &&
      user.tokensBalance < IMAGE_ANALYSIS_COST
    ) {
      await responseMessage.editText(
        getNoBalanceMessage({
          reqType: user.selectedModel,
          canActivateTrial: user.canActivateTrial,
          isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
          mode,
        }),
        {
          reply_markup: getTopupAndChangeModelKeyboard(user.subscriptionLevel),
          parse_mode: 'MarkdownV2',
        },
      );
      return false;
    }
    return true;
  }

  const settings = modelSettings[user.selectedModel];
  if (!settings) {
    throw new Error('Invalid model: ' + user.selectedModel);
  }

  const additionalCost = mode === 'voice' ? VOICE_ADDITIONAL_COST : 0;
  const totalCost = (settings.cost ?? 0) + additionalCost;

  let hasSufficient = false;
  for (const limitKey of settings.limitPriority) {
    if (limitKey === 'tokens') {
      // Only check tokens if cost is defined
      if (
        typeof settings.cost !== 'undefined' &&
        user.tokensBalance >= totalCost
      ) {
        hasSufficient = true;
        break;
      }
    } else {
      if (user[limitKey] > 0) {
        hasSufficient = true;
        break;
      }
    }
  }

  if (!hasSufficient) {
    await responseMessage.editText(
      getNoBalanceMessage({
        reqType: user.selectedModel,
        canActivateTrial: user.canActivateTrial,
        isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
        mode,
      }),
      {
        reply_markup: getTopupAndChangeModelKeyboard(user.subscriptionLevel),
        parse_mode: 'MarkdownV2',
      },
    );
  }
  return hasSufficient;
};

export const deductUserBalance = (
  user: Document<unknown, {}, IUser> &
    IUser & { _id: Types.ObjectId } & { __v: number },
  mode: 'voice' | 'text',
) => {
  const settings = modelSettings[user.selectedModel as AiModel];
  if (!settings) {
    throw new Error('Invalid model: ' + user.selectedModel);
  }

  const additionalCost = mode === 'voice' ? VOICE_ADDITIONAL_COST : 0;
  const totalCost = (settings.cost ?? 0) + additionalCost;

  let deducted = false;
  for (const limitKey of settings.limitPriority) {
    if (limitKey === 'tokens') {
      if (
        typeof settings.cost !== 'undefined' &&
        user.tokensBalance >= totalCost
      ) {
        user.tokensBalance -= totalCost;
        deducted = true;
        break;
      }
    } else {
      if (user[limitKey] > 0) {
        user[limitKey] = user[limitKey] - 1;
        deducted = true;
        break;
      }
    }
  }

  if (!deducted) {
    throw new Error('Insufficient balance at deduction time');
  }

  user.stats[settings.statsKey] += 1;
};

export const getMessagesHistory = async ({
  user,
  chatId,
  userMessage,
}: {
  user: Document<unknown, {}, IUser> &
    IUser & {
      _id: Types.ObjectId;
    } & {
      __v: number;
    };
  chatId: Types.ObjectId;
  userMessage: Document<unknown, {}, IMessage> & IMessage;
}) => {
  let history: IMessage[] = [];
  // Choose max history length based on user's subscription level
  let maxHistoryLength;
  switch (user.subscriptionLevel) {
    case SubscriptionLevels.START:
    case SubscriptionLevels.OPTIMUM:
    case SubscriptionLevels.OPTIMUM_TRIAL:
      maxHistoryLength = MAX_HISTORY_LENGTH_START_OPTIMUM;
      break;
    case SubscriptionLevels.PREMIUM:
    case SubscriptionLevels.ULTRA:
      maxHistoryLength = MAX_HISTORY_LENGTH_PREMIUM_ULTRA;
      break;
    default:
      maxHistoryLength = MAX_HISTORY_LENGTH_FREE;
      break;
  }
  const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();
  history = messages.slice(-maxHistoryLength).map((msg) => ({
    ...msg,
    imageData: msg.imageData ? Buffer.from(msg.imageData.buffer) : undefined,
  }));

  return history;
};

export const getLatestChat = async ({
  ctx,
  user,
  responseMessage,
}: {
  ctx: MyContext;
  user: Document<unknown, {}, IUser> & IUser;
  responseMessage: TelegramMessage.CommonMessage & MessageXFragment;
}) => {
  let chatId = ctx.session.chatId;
  let chatObj;

  if (!chatId) {
    const latestChat = await Chat.findOne({ userId: user._id }).sort({
      createdAt: -1,
    });
    if (latestChat) {
      chatObj = latestChat;
      chatId = latestChat._id.toString();
      ctx.session.chatId = chatId;
    } else {
      await responseMessage.editText(
        'Пожалуйста, начните новый чат с помощью команды /start',
      );
      return;
    }
  }

  const chat = chatObj || (await Chat.findById(chatId));

  return chat;
};

export const sanitizeGptAnswer = (answer: string) => {
  const answerCopy = answer;
  const sanitizedAnswer = telegramifyMarkdown(answerCopy, 'remove');
  return sanitizedAnswer;
};
