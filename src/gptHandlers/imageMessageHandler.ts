import 'dotenv/config';
import { GrammyError } from 'grammy';
import { Document, Types } from 'mongoose';
import { Message as TelegramMessage } from '@grammyjs/types';
import { MessageXFragment } from '@grammyjs/hydrate/out/data/message';
import { AiModels, MyContext, SubscriptionLevels } from '../types/types';
import { IUser } from '../../db/User';
import {
  getBotApiKey,
  logError,
  sendMessageToAdmin,
} from '../utils/utilFunctions';
import axios from 'axios';
import {
  getLatestChat,
  getVisionResponseFromOpenAIGpt,
  sanitizeGptAnswer,
} from '../utils/gpt';
import { IMAGE_ANALYSIS_COST, SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';
import Message from '../../db/Message';

export const handleImageMessage = async ({
  user,
  ctx,
  responseMessage,
}: {
  user: Document<unknown, {}, IUser> &
    IUser & {
      _id: Types.ObjectId;
    } & {
      __v: number;
    };
  ctx: MyContext;
  responseMessage: TelegramMessage.CommonMessage & MessageXFragment;
}) => {
  const file = await ctx.getFile();
  const filePath = file.file_path;
  if (!filePath) {
    await ctx.reply('🖼️ Произошла ошибка при получении изображения');
    return;
  }

  const chat = await getLatestChat({ user, ctx, responseMessage });
  if (!chat) {
    await ctx.reply(
      'Чат не найден. Пожалуйста, начните новый чат с помощью команды /start',
    );
    return;
  }

  const token = getBotApiKey();
  const url = `https://api.telegram.org/file/bot${token}/${filePath}`;

  const responseFromGpt = await getVisionResponseFromOpenAIGpt({
    imageUrl: url,
    telegramId: ctx.from!.id,
    caption: ctx.message?.caption,
  });

  if (!responseFromGpt) {
    await responseMessage.editText(
      `Произошла ошибка при обработке изображения или генерации ответа. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    return;
  }

  const sanitizedAnswer = sanitizeGptAnswer(responseFromGpt);

  if (
    process.env.ADMIN_TELEGRAM_ID &&
    ctx.from!.id !== Number(process.env.ADMIN_TELEGRAM_ID)
  ) {
    ctx.forwardMessage(process.env.ADMIN_TELEGRAM_ID);
    await sendMessageToAdmin(sanitizedAnswer || 'null');
  }

  if (
    user.subscriptionLevel === SubscriptionLevels.FREE ||
    user.subscriptionLevel === SubscriptionLevels.START
  ) {
    user.tokensBalance -= IMAGE_ANALYSIS_COST;
    await user.save();
  }

  const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
  const imageData = Buffer.from(imageResponse.data, 'binary');


  await Message.create({
    chatId: chat._id,
    userId: user._id,
    role: 'user',
    content: ctx.message?.caption || '',
    imageData,
    model: 'GPT_4O',
  });
  await Message.create({
    chatId: chat._id,
    userId: user._id,
    role: 'assistant',
    content: sanitizedAnswer,
    model: 'GPT_4O',
  });

  try {
    await responseMessage.editText(sanitizedAnswer, {
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    if (
      error instanceof GrammyError &&
      error.description.includes("can't parse entities")
    ) {
      await responseMessage.editText(responseFromGpt);
    } else {
      throw error;
    }
  }
};
