import { InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { generateImage } from '../utils/gpt';
import { logError } from '../utils/utilFunctions';
import { type MyConversation, type MyContext } from '../types/types';
import User from '../../db/User';
import { SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';

const cancelKeyboard = new InlineKeyboard().text(
  '❌ Отменить',
  'cancelImageGeneration',
);

export async function imageConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  try {
    const { id } = ctx.from as TelegramUser;
    await ctx.reply('Опишите, что должно быть на изображении?', {
      reply_markup: cancelKeyboard,
    });

    const { message } = await conversation.waitFor('message:text');
    if (message.text.length > 1500) {
      await ctx.reply(
        'Превышен лимит символов. Пожалуйста, сократите Ваше сообщение и начните генерацию заново командой /image.',
      );
      return;
    }
    const user = await conversation.external(() =>
      User.findOne({ telegramId: id }),
    );
    if (!user) {
      await ctx.reply(
        'Пожалуйста, начните новый чат с помощью команды /start',
      );
      return;
    }

    const responseMessage = await ctx.reply('Генерация изображения...');

    const imageUrl = await generateImage(
      message.text,
      ctx.session.imageQuality,
    );
    if (!imageUrl) {
      throw new Error('Image generation failed: no image URL');
    }
    await ctx.replyWithPhoto(imageUrl);
    await responseMessage.editText('Готово!');

    user.imageGenerationBalance -= 1;
    user.updatedAt = new Date();
    await conversation.external(() => user.save());
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при генерации изображения. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in image conversation',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }

  return;
}
