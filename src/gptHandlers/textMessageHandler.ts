import { GrammyError } from 'grammy';
import { MyContext, SubscriptionLevels, UserStages } from '../types/types';
import {
  User as TelegramUser,
  Message as TelegramMessage,
} from '@grammyjs/types';
import { MessageXFragment } from '@grammyjs/hydrate/out/data/message';
import { Document, Types } from 'mongoose';
import { AiModels } from '../types/types';
import { IUser } from '../../db/User';
import Message from '../../db/Message';
import {
  getLatestChat,
  getMessagesHistory,
  getResponseFromOpenAIGpt,
  sanitizeGptAnswer,
} from '../utils/gpt';
import {
  BASIC_REQUEST_COST,
  PRO_REQUEST_COST,
  VOICE_ADDITIONAL_COST,
  MAX_BOT_MESSAGE_LENGTH,
  MAX_USER_MESSAGE_LENGTH,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';

export const handleTextMessage = async ({
  user,
  ctx,
  responseMessage,
  messageText,
  voiceFileId,
}: {
  user: Document<unknown, {}, IUser> &
    IUser & {
      _id: Types.ObjectId;
    } & {
      __v: number;
    };
  ctx: MyContext;
  responseMessage: TelegramMessage.CommonMessage & MessageXFragment;
  messageText: string;
  voiceFileId?: string;
}) => {
  const telegramId = (ctx.from as TelegramUser).id;

  if (messageText!.length > MAX_USER_MESSAGE_LENGTH && !voiceFileId) {
    await ctx.reply(
      'Превышен лимит символов. Пожалуйста, сократите Ваше сообщение.',
    );
    return;
  }

  const chat = await getLatestChat({ user, ctx, responseMessage });
  if (!chat) {
    await ctx.reply(
      'Чат не найден. Пожалуйста, начните новый чат с помощью команды /start',
    );
    return;
  }

  const userMessage = await Message.create({
    chatId: chat._id,
    userId: user._id,
    role: 'user',
    content: messageText,
    voiceFileId,
    model: user.selectedModel,
    chatMode: user.chatMode,
  });

  const history = await getMessagesHistory({
    user,
    chatId: chat._id,
    userMessage,
  });

  const selectedModelName = user.selectedModel;
  const answer = await getResponseFromOpenAIGpt({
    chatHistory: history,
    telegramId,
    chatMode: user.chatMode,
    modelName: selectedModelName,
  });

  if (!answer) {
    await responseMessage.editText(
      `Произошла ошибка при генерации ответа. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    return;
  }

  const sanitizedAnswer = sanitizeGptAnswer(answer);

  await Message.create({
    chatId: chat._id,
    userId: user._id,
    role: 'assistant',
    content: sanitizedAnswer,
    model: user.selectedModel,
    chatMode: user.chatMode,
  });

  await chat.save();

  if (AiModels[user.selectedModel] === AiModels.GPT_4O) {
    if (user.proRequestsLeftThisMonth > 0) {
      user.proRequestsLeftThisMonth -= 1;
    } else {
      const cost = voiceFileId
        ? PRO_REQUEST_COST + VOICE_ADDITIONAL_COST
        : PRO_REQUEST_COST;
      user.tokensBalance -= cost;
    }
    user.stats.proReqsMade += 1;
  } else {
    if (user.basicRequestsLeftThisWeek > 0 && !voiceFileId) {
      user.basicRequestsLeftThisWeek -= 1;
    } else if (user.basicRequestsLeftToday > 0) {
      user.basicRequestsLeftToday -= 1;
    } else {
      const cost = voiceFileId
        ? BASIC_REQUEST_COST + VOICE_ADDITIONAL_COST
        : BASIC_REQUEST_COST;
      user.tokensBalance -= cost;
    }
    user.stats.basicReqsMade += 1;
  }
  user.markModified('stats');
  // if (
  //   user.subscriptionLevel === 'FREE' &&
  //   user.userStage === UserStages.SUBSCRIBED_TO_CHANNEL
  // ) {
  //   user.userStage = UserStages.USED_FREE_REQUESTS;
  // }
  // Temporary disable channel check
  if (
    user.subscriptionLevel === SubscriptionLevels.FREE &&
    (user.userStage === UserStages.REGISTERED ||
      user.userStage === UserStages.SUBSCRIBED_TO_CHANNEL)
  ) {
    user.userStage = UserStages.USED_FREE_REQUESTS;
  }
  user.updatedAt = new Date();
  await user.save();

  if (sanitizedAnswer.length > MAX_BOT_MESSAGE_LENGTH) {
    const chunks =
      sanitizedAnswer.match(
        new RegExp(`[^]{1,${MAX_BOT_MESSAGE_LENGTH}}`, 'g'),
      ) || [];
    await responseMessage.editText(chunks[0]!);
    for (let i = 1; i < chunks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await ctx.reply(chunks[i]);
    }
  } else {
    try {
      await responseMessage.editText(sanitizedAnswer, {
        parse_mode: 'MarkdownV2',
      });
    } catch (error) {
      if (
        error instanceof GrammyError &&
        error.description.includes("can't parse entities")
      ) {
        await responseMessage.editText(sanitizedAnswer);
      } else {
        throw error;
      }
    }
  }
};
