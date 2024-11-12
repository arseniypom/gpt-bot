import { InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { generateImage } from '../utils/gpt';
import { logError } from '../utils/utilFunctions';
import { type MyConversation, type MyContext } from '../types/types';
import User from '../../db/User';
import {
  BUTTON_LABELS,
  IMAGE_GENERATION_COST,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import { topupAndManageSubscriptionKeyboard } from '../commands/topup';

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
    const user = await conversation.external(() =>
      User.findOne({ telegramId: id }),
    );
    if (!user) {
      await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start');
      return;
    }
    if (
      user.imageGenerationLeftThisMonth === 0 &&
      user.tokensBalance - IMAGE_GENERATION_COST < 0
    ) {
      await ctx.reply(
        'У вас нет доступных запросов для генерации изображений. Смените уровень подписки или пополните баланс токенов ↓',
        {
          reply_markup: topupAndManageSubscriptionKeyboard,
        },
      );
      return;
    }

    await ctx.reply('Опишите, что должно быть на изображении?', {
      reply_markup: cancelKeyboard,
    });

    const { message } = await conversation.waitFor('message:text');

    if (Object.values(BUTTON_LABELS).includes(message.text)) {
      await ctx.reply(
        `Генерация изображения отменена\\.\nПожалуйста, нажмите кнопку *${message.text}* повторно`,
        {
          parse_mode: 'MarkdownV2',
        },
      );
      return;
    }
    if (message.text.length > 1500) {
      await ctx.reply(
        'Превышен лимит символов. Пожалуйста, сократите Ваше сообщение и начните генерацию заново командой /image.',
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

    if (user.imageGenerationLeftThisMonth > 0) {
      user.imageGenerationLeftThisMonth -= 1;
    } else {
      user.tokensBalance -= IMAGE_GENERATION_COST;
    }
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
