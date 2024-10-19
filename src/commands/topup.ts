import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { logError } from '../utils/alert';
import { MyContext } from '../types/types';

export const startTopupKeyboard = new InlineKeyboard().text(
  'Пополнить баланс',
  'topup',
);
const topupKeyboard = new InlineKeyboard()
  .text('1', 'req1')
  .text('2', 'req2')
  .text('3', 'req3')
  .row()
  .text('4', 'img1')
  .text('5', 'img2')
  .text('6', 'img3')
  .row()
  .text('7', 'combo1')
  .text('8', 'combo2')
  .text('9', 'combo3')
  .row();

export const topup = async (ctx: CallbackQueryContext<MyContext> | MyContext) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }

  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    const topupMessage = `
  *Выберите набор запросов для пополнения*
  
  📝 *Текстовые запросы*
  \\[1\\] 100 запросов \\(базовые\\) ⭐️ 99₽
  \\[2\\] 500 запросов \\(базовые\\) ⭐️ 299₽
  \\[3\\] 1000 запросов \\(950 базовые \\+ 50 про\\) 🌟 599₽
    
  🎨 *Генерация изображений*
  \\[4\\] 10 изображений 🌅 119₽
  \\[5\\] 25 изображений 🌅 259₽
  \\[6\\] 50 изображений 🌅 449₽
    
  😮📝\\+🎨 *Комбо* \\(_самый выгодный вариант_\\)
  \\[7\\] 100 запросов \\+ 10 изображений 179₽
  \\[8\\] 500 запросов \\+ 25 изображений 499₽
  \\[9\\] 1000 запросов \\(950 базовые \\+ 50 про\\) \\+ 50 изображений 899₽
  `;

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
