import { InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { generateImage } from '../utils/gpt';
import { logError } from '../utils/utilFunctions';
import { type MyConversation, type MyContext, SubscriptionLevels } from '../types/types';
import User from '../../db/User';
import {
  BUTTON_LABELS,
  getNoBalanceMessage,
  IMAGE_GENERATION_COST,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import { getTopupAndManageSubscriptionKeyboard } from '../commands/topup';

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
    const userObj = await conversation.external(() =>
      User.findOne({ telegramId: id }),
    );
    if (!userObj) {
      await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start');
      return;
    }
    if (
      userObj.imageGenerationLeftThisMonth === 0 &&
      userObj.tokensBalance - IMAGE_GENERATION_COST < 0
    ) {
      await ctx.reply(
        getNoBalanceMessage({
          reqType: 'image',
          canActivateTrial: userObj.canActivateTrial,
          isFreeUser: userObj.subscriptionLevel === SubscriptionLevels.FREE,
        }),
        {
          reply_markup: getTopupAndManageSubscriptionKeyboard(
            userObj.subscriptionLevel,
          ),
          parse_mode: 'MarkdownV2',
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
      conversation.session.imageQuality,
    );
    if (!imageUrl) {
      throw new Error('Image generation failed: no image URL');
    }
    await ctx.replyWithPhoto(imageUrl);
    await responseMessage.editText('Готово!');

    const user = await conversation.external(() =>
      User.findOne({ telegramId: id }),
    );
    const date = await conversation.external(() => new Date());
    if (user!.imageGenerationLeftThisMonth > 0) {
      await conversation.external(() =>
        User.updateOne(
          { telegramId: id },
          {
            updatedAt: date,
            imageGenerationLeftThisMonth:
              user!.imageGenerationLeftThisMonth - 1,
            stats: {
              ...user!.stats,
              imgGensMade: user!.stats.imgGensMade + 1,
            },
          },
        ),
      );
    } else {
      await conversation.external(() =>
        User.updateOne(
          { telegramId: id },
          {
            updatedAt: date,
            tokensBalance: user!.tokensBalance - IMAGE_GENERATION_COST,
            stats: {
              ...user!.stats,
              imgGensMade: user!.stats.imgGensMade + 1,
            },
          },
        ),
      );
    }
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
