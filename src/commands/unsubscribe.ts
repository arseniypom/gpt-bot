import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { MyContext, SubscriptionLevels } from '../types/types';
import User from '../../db/User';
import { SUPPORT_MESSAGE_POSTFIX, UNSUBSCRIBE_REASONS } from '../utils/consts';
import { logError, sendMessageToAdmin } from '../utils/utilFunctions';
import dayjs from 'dayjs';

const unsubscribeVerificationKeyboard = new InlineKeyboard()
  .text('❌ Нет, выйти', 'cancelUnsubscribe')
  .row()
  .text('Да', 'verifySubscriptionCancel');

const unsubscribeReasonKeyboard = new InlineKeyboard()
  .text(UNSUBSCRIBE_REASONS.tokens, 'tokens')
  .row()
  .text(UNSUBSCRIBE_REASONS.somethingNotWorking, 'somethingNotWorking')
  .row()
  .text(UNSUBSCRIBE_REASONS.notUsingBot, 'notUsingBot')
  .row()
  .text(
    UNSUBSCRIBE_REASONS.subscriptionTooExpensive,
    'subscriptionTooExpensive',
  )
  .row()
  .text(UNSUBSCRIBE_REASONS.enoughFreeTariff, 'enoughFreeTariff')
  .row()
  .text(UNSUBSCRIBE_REASONS.otherReason, 'otherReason')
  .row()
  .text('❌ Остановить отмену подписки', 'cancelUnsubscribe');

export const unsubscribeInitiate = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('Вы уверены, что хотите отменить подписку?', {
    reply_markup: unsubscribeVerificationKeyboard,
  });
};

export const getUnsubscribeReason = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();
  await ctx.callbackQuery.message?.editText(
    'Нам очень жаль 🙁\nРасскажите, пожалуйста, почему Вы решили отменить подписку? Это поможет нам стать лучше 🪴',
    {
      reply_markup: unsubscribeReasonKeyboard,
    },
  );
};

export const unsubscribeFinalStep = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();
  try {
    const { id } = ctx.from as TelegramUser;
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start');
      return;
    }

    const reason = ctx.callbackQuery.data;

    switch (reason) {
      case 'somethingNotWorking':
        sendMessageToAdmin(
          `Пользователь ${user.telegramId} отменил подписку по причине "Что-то не работает" ⭕`,
        );
      case 'tokens':
      case 'notUsingBot':
      case 'subscriptionTooExpensive':
      case 'enoughFreeTariff':
      case 'otherReason':
        user.unsubscribeReason = reason;
        user.newSubscriptionLevel = SubscriptionLevels.FREE;
        user.updatedAt = new Date();
        await user.save();

        const expirationDate = dayjs(user.subscriptionExpiry).format(
          'DD.MM.YYYY',
        );

        await ctx.callbackQuery.message?.editText(
          `Продление подписки отменено ✅\nОна будет действовать до ${expirationDate}\nНадеемся, что в скором времени снова увидим Вас в нашем боте! 🙌`,
        );
        break;
      case 'cancelUnsubscribe':
        await ctx.answerCallbackQuery('Отменено ✅');
        await ctx.callbackQuery.message?.editText('Действие отменено');
        return;
      default:
        break;
    }
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при отмене подписки. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in unsubscribe conversation',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
