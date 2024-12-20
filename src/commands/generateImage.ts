import 'dotenv/config';
import { InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import {
  ImageGenerationQuality,
  MyContext,
  SubscriptionLevels,
} from '../types/types';
import {
  getNoBalanceMessage,
  IMAGE_GENERATION_COST,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import { logError } from '../utils/utilFunctions';
import User from '../../db/User';
import { getTopupAndManageSubscriptionKeyboard } from './topup';

export const generateImage = async (ctx: MyContext) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    if (
      user.imageGenerationLeftThisMonth === 0 &&
      user.tokensBalance - IMAGE_GENERATION_COST < 0
    ) {
      await ctx.reply(
        getNoBalanceMessage({
          reqType: 'image',
          canActivateTrial: user.canActivateTrial,
          isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
        }),
        {
          reply_markup: getTopupAndManageSubscriptionKeyboard(
            user.subscriptionLevel,
          ),
          parse_mode: 'MarkdownV2',
        },
      );
      return;
    }

    if (process.env.IMAGE_QUALITY_CHANGE_AVAILABLE !== 'true') {
      await ctx.conversation.enter('imageConversation');
      return;
    }

    const isHDGenerationAvailableForUser =
      user.subscriptionLevel !== SubscriptionLevels.FREE &&
      user.subscriptionLevel !== SubscriptionLevels.START;

    const qualityKeyboard = new InlineKeyboard()
      .text('Standard', ImageGenerationQuality.STANDARD)
      .text(
        `HD${isHDGenerationAvailableForUser ? '' : '🔒'}`,
        ImageGenerationQuality.HD,
      )
      .row()
      .text('❌ Отменить', 'cancelImageGeneration');

    await ctx.reply(
      `*Выберите качество изображения:*
    ⋅ Standard — стандартное
    ⋅ HD — повышенная детализация ✨`,
      {
        reply_markup: qualityKeyboard,
        parse_mode: 'MarkdownV2',
      },
    );
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при генерации изображения. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in generateImage command',
      error,
      telegramId: id,
      username: ctx.from?.username,
    });
  }
};
