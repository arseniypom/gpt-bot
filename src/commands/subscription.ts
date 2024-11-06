import { CallbackQueryContext, InlineKeyboard, InputFile } from 'grammy';
import { logError } from '../utils/utilFunctions';
import { MyContext } from '../types/types';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import { SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';

export const initiateSubscriptionKeyboard = new InlineKeyboard().text(
  'Управление подпиской',
  'subscription',
);
const subscriptionKeyboardForImg = new InlineKeyboard()
  .text(`${SUBSCRIPTIONS.BASIC.icon} ${SUBSCRIPTIONS.BASIC.title}`, 'BASIC')
  .row()
  .text(`${SUBSCRIPTIONS.PRO.icon} ${SUBSCRIPTIONS.PRO.title}`, 'PRO')
  .row()
  .text(`${SUBSCRIPTIONS.ULTIMATE.icon} ${SUBSCRIPTIONS.ULTIMATE.title}`, 'ULTIMATE');

export const subscription = async (
  ctx: CallbackQueryContext<MyContext> | MyContext,
) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }

  try {
    await ctx.replyWithPhoto(
      new InputFile('src/images/subscriptions-img.png'),
      {
        caption:
          '*Информация о тарифах подписки 👆*\n\nВыберите тариф для подключения',
        parse_mode: 'MarkdownV2',
        reply_markup: subscriptionKeyboardForImg,
      },
    );
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
