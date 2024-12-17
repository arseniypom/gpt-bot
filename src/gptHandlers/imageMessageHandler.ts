import 'dotenv/config';
import { Document, Types } from 'mongoose';
import { Message as TelegramMessage } from '@grammyjs/types';
import { MessageXFragment } from '@grammyjs/hydrate/out/data/message';
import { MyContext, SubscriptionLevels } from '../types/types';
import { IUser } from '../../db/User';
import {
  getBotApiKey,
  logError,
  sendMessageToAdmin,
} from '../utils/utilFunctions';
import axios from 'axios';
import { getVisionResponseFromOpenAIGpt } from '../utils/gpt';
import { IMAGE_ANALYSIS_COST, SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';

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

  const token = getBotApiKey();
  const url = `https://api.telegram.org/file/bot${token}/${filePath}`;

  const responseFromGpt = await getVisionResponseFromOpenAIGpt({
    imageUrl: url,
    telegramId: ctx.from!.id,
    caption: ctx.message?.caption,
  });

  if (
    process.env.ADMIN_TELEGRAM_ID &&
    ctx.from!.id !== Number(process.env.ADMIN_TELEGRAM_ID)
  ) {
    ctx.forwardMessage(process.env.ADMIN_TELEGRAM_ID);
    await sendMessageToAdmin(responseFromGpt || 'null');
  }

  if (!responseFromGpt) {
    await responseMessage.editText(
      `Произошла ошибка при обработке изображения или генерации ответа. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    return;
  }

  if (
    user.subscriptionLevel === SubscriptionLevels.FREE ||
    user.subscriptionLevel === SubscriptionLevels.START
  ) {
    user.tokensBalance -= IMAGE_ANALYSIS_COST;
    await user.save();
  }

  await responseMessage.editText(responseFromGpt);
};
