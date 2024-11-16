import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { logError } from '../utils/utilFunctions';
import { MyContext, SubscriptionLevel } from '../types/types';
import { BUTTON_LABELS, TOPUP_MESSAGE } from '../utils/consts';
import { TOKEN_PACKAGES } from '../bot-token-packages';

const topupKeyboard = new InlineKeyboard()
  .text(`${TOKEN_PACKAGES.token1.tokensNumber}`, 'token1')
  .row()
  .text(`${TOKEN_PACKAGES.token2.tokensNumber}`, 'token2')
  .row()
  .text(`${TOKEN_PACKAGES.token3.tokensNumber}`, 'token3');

export const initiateTopupKeyboard = new InlineKeyboard().text(
  BUTTON_LABELS.buyTokens,
  'topup',
);
export const topupAndManageSubscriptionKeyboard = new InlineKeyboard()
  .text(BUTTON_LABELS.buyTokens, 'topup')
  .row()
  .text('🔄 Управление подпиской', 'subscriptionManage');
export const getTopupAndManageSubscriptionKeyboard = (
  subscriptionLevel: SubscriptionLevel,
) => {
  const keyboard = new InlineKeyboard()
    .text(BUTTON_LABELS.buyTokens, 'topup')
    .row();

  if (subscriptionLevel === 'FREE') {
    keyboard.text('🎉 Подключить подписку', 'subscription');
  } else {
    keyboard.text('🔄 Управление подпиской', 'subscriptionManage');
  }

  return keyboard;
};
export const getTopupAndChangeModelKeyboard = (
  subscriptionLevel: SubscriptionLevel,
) => {
  const keyboard = new InlineKeyboard()
    .text(BUTTON_LABELS.buyTokens, 'topup')
    .row();

  if (subscriptionLevel === 'FREE') {
    keyboard.text('🎉 Подключить подписку', 'subscription');
  } else {
    keyboard.text('🔄 Управление подпиской', 'subscriptionManage');
  }

  return keyboard.row().text('🤖 Сменить модель', 'initiateAiModelChange');
};

export const topup = async (
  ctx: CallbackQueryContext<MyContext> | MyContext,
) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }

  try {
    await ctx.reply(TOPUP_MESSAGE, {
      parse_mode: 'MarkdownV2',
      reply_markup: topupKeyboard,
    });
  } catch (error) {
    logError({
      message: 'Error in topup callbackQuery or command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
