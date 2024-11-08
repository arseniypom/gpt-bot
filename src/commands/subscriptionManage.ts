import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { MyContext } from '../types/types';
import User from '../../db/User';
import {
  getManageSubscriptionMessage,
  UNSUBSCRIBE_REASONS,
} from '../utils/consts';

const subscriptionManageKeyboard = new InlineKeyboard()
  .text('🔄 Изменить уровень подписки', 'initiateChangeSubscriptionLevel')
  .row()
  .text('❌ Отменить подписку', 'unsubscribe')
  .row()
  .text('← Назад', 'backToMyProfile');

const unsubscribeVerificationKeyboard = new InlineKeyboard()
  .text('❌ Нет, выйти', 'cancelUnsubscribe')
  .row()
  .text('Да', 'verifySubscriptionCancel');

export const subscriptionManage = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();

  const { id } = ctx.from as TelegramUser;
  const user = await User.findOne({ telegramId: id });

  if (!user) {
    await ctx.reply('Пожалуйста, начните с команды /start');
    return;
  }

  await ctx.callbackQuery.message?.editText(
    getManageSubscriptionMessage(user),
    {
      parse_mode: 'MarkdownV2',
      reply_markup: subscriptionManageKeyboard,
    },
  );

  // await ctx.reply(getManageSubscriptionMessage(user), {
  //   parse_mode: 'MarkdownV2',
  //   reply_markup: subscriptionManageKeyboard,
  // });
};
