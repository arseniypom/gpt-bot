import { User as TelegramUser } from '@grammyjs/types';
import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import User from '../../db/User';
import { MyContext, SubscriptionLevels } from '../types/types';
import { getProfileMessage } from '../utils/consts';
import { SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';
import { logError } from '../utils/utilFunctions';

export const profileAddSubscriptionKeyboard = new InlineKeyboard()
  .text('🎉 Подключить подписку', 'subscription')
  .row()
  .text('🪙 Купить токены', 'topup');

const profileManageSubscriptionKeyboard = new InlineKeyboard()
  .text('🪙 Купить токены', 'topup')
  .row()
  .text('� Управление подпиской', 'subscriptionManage');

export const myProfile = async (
  ctx: MyContext | CallbackQueryContext<MyContext>,
) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }

    const isSubscribed = user.subscriptionLevel !== SubscriptionLevels.FREE;

    if (ctx.callbackQuery) {
      await ctx.callbackQuery.message?.editText(getProfileMessage(user), {
        parse_mode: 'MarkdownV2',
        reply_markup: isSubscribed
          ? profileManageSubscriptionKeyboard
          : profileAddSubscriptionKeyboard,
      });
    } else {
      await ctx.reply(getProfileMessage(user), {
        parse_mode: 'MarkdownV2',
        reply_markup: isSubscribed
          ? profileManageSubscriptionKeyboard
          : profileAddSubscriptionKeyboard,
      });
    }
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при получении данных профиля. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in /myProfile command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }

  return;
};
