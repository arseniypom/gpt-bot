import { CallbackQueryContext, InlineKeyboard, InputFile } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { logError } from '../utils/utilFunctions';
import { MyContext } from '../types/types';

export const startTopupKeyboard = new InlineKeyboard().text(
  'Пополнить баланс',
  'topup',
);
const topupKeyboard = new InlineKeyboard()
  .text('1️⃣', 'req1')
  .text('2️⃣', 'req2')
  .text('3️⃣', 'req3')
  .row()
  .text('4️⃣', 'img1')
  .text('5️⃣', 'img2')
  .text('6️⃣', 'img3')
  .row()
  .text('7️⃣', 'combo1')
  .text('8️⃣', 'combo2')
  .text('9️⃣', 'combo3')
  .row();

export const topup = async (
  ctx: CallbackQueryContext<MyContext> | MyContext,
) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }

  try {
    await ctx.replyWithPhoto(new InputFile('src/images/packages-img.jpeg'), {
      caption: '*Информация о пакетах 👆*\n\nВыберите пакет для пополнения\\:',
      parse_mode: 'MarkdownV2',
      reply_markup: topupKeyboard,
    });
    await ctx.reply('Если картинка не отображается, посмотрите текстовую версию: /topupText');
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при пополнении баланса. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError({
      message: 'Error in /topup command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};

export const topupText = async (ctx: MyContext) => {
  try {
    const topupMessage = `
*Выберите набор запросов\nдля пополнения*

*Текстовые запросы*
1️⃣ 100 запросов \\(базовые\\) ⭐️ 99₽
2️⃣ 500 запросов \\(базовые\\) ⭐️ 299₽
3️⃣ 1000 запросов\n\\(950 базовые \\+ 50 про\\) 🌟 599₽

*Генерация изображений*
4️⃣ 10 изображений 🖼️ 119₽
5️⃣ 25 изображений 🖼️ 259₽
6️⃣ 50 изображений 🖼️ 449₽

*Комбо* \\(💎 _самый выгодный вариант_\\)
7️⃣ 100 запросов \\+ 10 изображений 179₽
8️⃣ 500 запросов \\+ 25 изображений 499₽
9️⃣ 1000 запросов \\(950 базовые \\+ 50 про\\)\n\\+ 50 изображений 899₽
    `;
    await ctx.reply(topupMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: topupKeyboard,
    });
  } catch (error) {
    logError({
      message: 'Error in /topupText command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
