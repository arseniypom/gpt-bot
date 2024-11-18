import { User as TelegramUser } from '@grammyjs/types';
import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import User from '../../db/User';
import { logError } from '../utils/utilFunctions';
import {
  MyContext,
  SubscriptionLevel,
  SubscriptionLevels,
} from '../types/types';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import {
  SUBSCRIPTIONS_MESSAGE,
  SUBSCRIPTIONS_MESSAGE_WITH_TRIAL,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';

export const initiateSubscriptionKeyboard = new InlineKeyboard().text(
  'Управление подпиской',
  'subscription',
);

export const getSubscriptionLevelsKeyboard = ({
  isHelp,
  canActivateTrial,
}: {
  isHelp?: boolean;
  canActivateTrial?: boolean;
} = {}) => {
  const keyboard = new InlineKeyboard();

  Object.keys(SUBSCRIPTIONS)
    .filter((key) => {
      if (!canActivateTrial) {
        return (
          key !== SubscriptionLevels.FREE &&
          key !== SubscriptionLevels.OPTIMUM_TRIAL
        );
      }
      return (
        key !== SubscriptionLevels.FREE && key !== SubscriptionLevels.OPTIMUM
      );
    })
    .forEach((key) => {
      const subscription = SUBSCRIPTIONS[key as SubscriptionLevel];
      const btnText =
        key === SubscriptionLevels.OPTIMUM_TRIAL
          ? `🎉 ${subscription.title} за ${subscription.price}₽ на ${subscription.duration?.days} дня 🎉`
          : `${subscription.title} за ${subscription.price}₽/мес`;
      keyboard.text(btnText, key.toUpperCase()).row();
    });

  if (isHelp) {
    keyboard.text('← Назад', 'helpBack');
  }

  return keyboard;
};

export const getChangeSubscriptionLevelsKeyboard = () => {
  const keyboard = new InlineKeyboard();

  Object.keys(SUBSCRIPTIONS)
    .filter(
      (key) =>
        key !== SubscriptionLevels.FREE &&
        key !== SubscriptionLevels.OPTIMUM_TRIAL,
    )
    .forEach((key) => {
      const subscription = SUBSCRIPTIONS[key as SubscriptionLevel];
      keyboard
        .text(
          `${subscription.title} за ${subscription.price}₽/мес`,
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
    const { id } = ctx.from as TelegramUser;

    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }

    const message = user.canActivateTrial
      ? SUBSCRIPTIONS_MESSAGE_WITH_TRIAL
      : SUBSCRIPTIONS_MESSAGE;

    await ctx.reply(message.replace(/[().-]/g, '\\$&'), {
      parse_mode: 'MarkdownV2',
      reply_markup: getSubscriptionLevelsKeyboard({
        canActivateTrial: user.canActivateTrial,
      }),
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
