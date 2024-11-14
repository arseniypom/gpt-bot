import { CallbackQueryContext, InlineKeyboard, InputFile } from 'grammy';
import { logError } from '../utils/utilFunctions';
import {
  MyContext,
  SubscriptionLevel,
  SubscriptionLevels,
} from '../types/types';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import {
  SUBSCRIPTIONS_MESSAGE,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';

export const initiateSubscriptionKeyboard = new InlineKeyboard().text(
  'Управление подпиской',
  'subscription',
);

export const getSubscriptionLevelsKeyboard = (isHelp = false) => {
  const keyboard = new InlineKeyboard();

  Object.keys(SUBSCRIPTIONS)
    .filter((key) => key !== SubscriptionLevels.FREE)
    .forEach((key) => {
      const subscription = SUBSCRIPTIONS[key as SubscriptionLevel];
      keyboard
        .text(
          `${subscription.icon} ${subscription.title} за ${subscription.price}₽/мес`,
          key.toUpperCase(),
        )
        .row();
    });

  if (isHelp) {
    keyboard.text('← Назад', 'helpBack');
  }

  return keyboard;
};

export const getChangeSubscriptionLevelsKeyboard = () => {
  const keyboard = new InlineKeyboard();

  Object.keys(SUBSCRIPTIONS)
    .filter((key) => key !== SubscriptionLevels.FREE)
    .forEach((key) => {
      const subscription = SUBSCRIPTIONS[key as SubscriptionLevel];
      keyboard
        .text(
          `${subscription.icon} ${subscription.title} за ${subscription.price}₽/мес`,
          `${key}-CHANGE`,
        )
        .row();
    });

  return keyboard;
};

export const subscription = async (
  ctx: CallbackQueryContext<MyContext> | MyContext,
) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }

  try {
    await ctx.reply(SUBSCRIPTIONS_MESSAGE.replace(/[().-]/g, '\\$&'), {
      parse_mode: 'MarkdownV2',
      reply_markup: getSubscriptionLevelsKeyboard(),
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при выборе тарифа подписки. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in /subscription command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
