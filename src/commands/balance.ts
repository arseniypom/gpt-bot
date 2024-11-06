import 'dotenv/config';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { MyContext } from '../types/types';
import { getBalanceMessage, SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';
import { initiateTopupKeyboard } from '../commands/topup';
import { logError } from '../utils/utilFunctions';

export const balance = async (ctx: MyContext) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    await ctx.reply(getBalanceMessage(user), {
      parse_mode: 'MarkdownV2',
      reply_markup: initiateTopupKeyboard,
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при получении баланса. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in /balance command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
