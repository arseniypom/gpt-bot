import { InputFile } from 'grammy';

import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { MyContext, SubscriptionLevels } from '../types/types';
import User from '../../db/User';
import {
  SUBSCRIPTIONS_MESSAGE,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import { logError } from '../utils/utilFunctions';
import dayjs from 'dayjs';
import { isValidSubscriptionLevel } from '../types/typeguards';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import {
  getChangeSubscriptionLevelsKeyboard,
  getSubscriptionLevelsKeyboard,
} from './subscription';

export const initiateChangeSubscriptionLevel = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();

  await ctx.reply(SUBSCRIPTIONS_MESSAGE.replace(/[().-]/g, '\\$&'), {
    parse_mode: 'MarkdownV2',
    reply_markup: getChangeSubscriptionLevelsKeyboard(),
  });
};

export const changeSubscriptionLevel = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();
  const newSubscriptionLevel = ctx.callbackQuery.data.split('-')[0];

  try {
    const { id } = ctx.from as TelegramUser;
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start');
      return;
    }
    if (user.subscriptionLevel === SubscriptionLevels.FREE) {
      await ctx.callbackQuery.message?.delete();
      await ctx.reply('Пожалуйста, выберите уровень подписки повторно:', {
        reply_markup: getSubscriptionLevelsKeyboard(),
      });
      return;
    }
    if (isValidSubscriptionLevel(newSubscriptionLevel)) {
      user.newSubscriptionLevel = newSubscriptionLevel;
      user.updatedAt = new Date();
      await user.save();

      const expirationDate = dayjs(user.subscriptionExpiry)
        .format('DD.MM.YYYY')
        .replace(/\./g, '\\.');

      await ctx.reply(
        `Профиль обновлен ✅\n\nТекущий уровень подписки \\(*${
          SUBSCRIPTIONS[user.subscriptionLevel].title
        }*\\) будет действовать до ${expirationDate}, после чего Вы автоматически переключитесь на новый уровень \– *${
          SUBSCRIPTIONS[user.newSubscriptionLevel].title
        }*\n`,
        { parse_mode: 'MarkdownV2' },
      );
    }
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при изменении уровня подписки. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in change subscription level',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
