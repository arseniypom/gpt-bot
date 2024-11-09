import { CallbackQueryContext, InlineKeyboard, InputFile } from 'grammy';
import { logError } from '../utils/utilFunctions';
import { MyContext } from '../types/types';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import {
  SUBSCRIPTIONS_MESSAGE,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';

export const initiateSubscriptionKeyboard = new InlineKeyboard().text(
  'Управление подпиской',
  'subscription',
);
export const subscriptionKeyboardForImg = new InlineKeyboard()
  .text(
    `${SUBSCRIPTIONS.MINI.icon} ${SUBSCRIPTIONS.MINI.title} за ${SUBSCRIPTIONS.MINI.price}₽/мес`,
    'MINI',
  )
  .row()
  .text(
    `${SUBSCRIPTIONS.BASIC.icon} ${SUBSCRIPTIONS.BASIC.title} за ${SUBSCRIPTIONS.BASIC.price}₽/мес`,
    'BASIC',
  )
  .row()
  .text(
    `${SUBSCRIPTIONS.PRO.icon} ${SUBSCRIPTIONS.PRO.title} за ${SUBSCRIPTIONS.PRO.price}₽/мес`,
    'PRO',
  )
  .row()
  .text(
    `${SUBSCRIPTIONS.ULTIMATE.icon} ${SUBSCRIPTIONS.ULTIMATE.title} за ${SUBSCRIPTIONS.ULTIMATE.price}₽/мес`,
    'ULTIMATE',
  );

export const changeSubscriptionKeyboardForImg = new InlineKeyboard()
  .text(
    `${SUBSCRIPTIONS.MINI.icon} ${SUBSCRIPTIONS.MINI.title} за ${SUBSCRIPTIONS.MINI.price}₽/мес`,
    'MINI-CHANGE',
  )
  .row()
  .text(
    `${SUBSCRIPTIONS.BASIC.icon} ${SUBSCRIPTIONS.BASIC.title} за ${SUBSCRIPTIONS.BASIC.price}₽/мес`,
    'BASIC-CHANGE',
  )
  .row()
  .text(
    `${SUBSCRIPTIONS.PRO.icon} ${SUBSCRIPTIONS.PRO.title} за ${SUBSCRIPTIONS.PRO.price}₽/мес`,
    'PRO-CHANGE',
  )
  .row()
  .text(
    `${SUBSCRIPTIONS.ULTIMATE.icon} ${SUBSCRIPTIONS.ULTIMATE.title} за ${SUBSCRIPTIONS.ULTIMATE.price}₽/мес`,
    'ULTIMATE-CHANGE',
  );

export const subscription = async (
  ctx: CallbackQueryContext<MyContext> | MyContext,
) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }

  try {
    await ctx.reply(SUBSCRIPTIONS_MESSAGE.replace(/[().-]/g, '\\$&'), {
      parse_mode: 'MarkdownV2',
      reply_markup: subscriptionKeyboardForImg,
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
