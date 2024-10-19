import { InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { logError } from '../utils/alert';
import { MyContext } from '../types/types';

export const startTopupKeyboard = new InlineKeyboard().text(
  'Пополнить баланс',
  'topup',
);
const topupKeyboard = new InlineKeyboard()
  .text('1', 'topup 100')
  .text('2', 'topup 500')
  .text('3', 'topup 1000')
  .row()
  .text('4', 'topup 10')
  .text('5', 'topup 25')
  .text('6', 'topup 50')
  .row()
  .text('7', 'topup 1010')
  .text('8', 'topup 5025')
  .text('9', 'topup 10050')
  .row();

export const topup = async (ctx: MyContext) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    const topupMessage = `*Выберите набор запросов для пополнения*
    \\– Текстовые запросы
  \\[1\\] 100 запросов \\(базовые\\) ⭐️
  \\[2\\] 500 запросов \\(базовые\\) ⭐️
  \\[3\\] 1000 запросов \\(950 базовые + 50 про\\) 🌟
    
    \\– Генерация изображений
  \\[4\\] 10 изображений 🌅
  \\[5\\] 25 изображений 🌅
  \\[6\\] 50 изображений 🌅
    
    \\– Комбо \\(_самый выгодный вариант_\\)
  \\[7\\] 100 запросов \\+ 10 изображений 🌅
  \\[8\\] 500 запросов \\+ 25 изображений 🌅
  \\[9\\] 1000 запросов \\(950 базовые \\+ 50 про\\) \\+ 50 изображений 🌅`;

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
