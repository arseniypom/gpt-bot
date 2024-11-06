import { User as TelegramUser } from '@grammyjs/types';
import { InlineKeyboard } from 'grammy';
import User from '../../db/User';
import { MyContext } from '../types/types';
import { getProfileMessage } from '../utils/consts';
import { SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';
import { logError } from '../utils/utilFunctions';

const myProfileKeyboard = new InlineKeyboard()
  .text('🎉 Подключить подписку', 'subscription')
  .row()
  .text('💰 Купить дополнительные запросы', 'topup');

export const myProfile = async (ctx: MyContext) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }

    await ctx.reply(getProfileMessage(user), {
      parse_mode: 'MarkdownV2',
      reply_markup: myProfileKeyboard,
    });
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
};
