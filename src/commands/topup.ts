import { InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { logError } from '../utils/alert';
import { MyContext } from '../types/types';

export const startTopupKeyboard = new InlineKeyboard().text('Пополнить баланс', 'topup');
const topupKeyboard = new InlineKeyboard()
.text('100', 'topup 100')
.text('500', 'topup 500')
.text('1000', 'topup 1000')
.text('2000', 'topup 2000')
.text('5000', 'topup 5000')
.row();

export const topup = async (ctx: MyContext) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    const topupMessage = `Выберите количество запросов для пополнения:
    \\- 100 запросов
    \\- 500 запросов
    \\- 1000 запросов`;

    await ctx.reply(topupMessage, {
      reply_markup: topupKeyboard,
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при пополнении баланса. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in /topup command:', error);
  }
};
