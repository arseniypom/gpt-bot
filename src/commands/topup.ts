import { CallbackQueryContext, InlineKeyboard, InputFile } from 'grammy';
import { logError } from '../utils/utilFunctions';
import { MyContext } from '../types/types';
import { PACKAGES } from '../bot-packages';

export const initiateTopupKeyboard = new InlineKeyboard().text(
  'Пополнить баланс',
  'topup',
);
export const topupAndChangeModelKeyboard = new InlineKeyboard()
  .text('Пополнить баланс', 'topup')
  .row()
  .text('Сменить модель', 'changeModel');
const topupKeyboardForImg = new InlineKeyboard()
  .text(PACKAGES.req1.numberIcon, 'req1')
  .text(PACKAGES.req2.numberIcon, 'req2')
  .text(PACKAGES.req3.numberIcon, 'req3')
  .row()
  .text(PACKAGES.img1.numberIcon, 'img1')
  .text(PACKAGES.img2.numberIcon, 'img2')
  .text(PACKAGES.img3.numberIcon, 'img3')
  .row()
  .text(PACKAGES.combo1.numberIcon, 'combo1')
  .text(PACKAGES.combo2.numberIcon, 'combo2')
  .text(PACKAGES.combo3.numberIcon, 'combo3')
  .row()
  .text('Текстовое описание пакетов', 'topupText');

const topupKeyboardForText = new InlineKeyboard()
  .text(PACKAGES.req1.numberIcon, 'req1')
  .text(PACKAGES.req2.numberIcon, 'req2')
  .text(PACKAGES.req3.numberIcon, 'req3')
  .row()
  .text(PACKAGES.img1.numberIcon, 'img1')
  .text(PACKAGES.img2.numberIcon, 'img2')
  .text(PACKAGES.img3.numberIcon, 'img3')
  .row()
  .text(PACKAGES.combo1.numberIcon, 'combo1')
  .text(PACKAGES.combo2.numberIcon, 'combo2')
  .text(PACKAGES.combo3.numberIcon, 'combo3')
  .row();

export const topupImg = async (
  ctx: CallbackQueryContext<MyContext> | MyContext,
) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }

  try {
    await ctx.replyWithPhoto(new InputFile('src/images/packages-img.jpeg'), {
      caption: '*Информация о пакетах 👆*\n\nВыберите пакет для пополнения',
      parse_mode: 'MarkdownV2',
      reply_markup: topupKeyboardForImg,
    });
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

export const topupText = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();

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
    await ctx.callbackQuery.message?.delete();
    await ctx.reply(topupMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: topupKeyboardForText,
    });
  } catch (error) {
    logError({
      message: 'Error in topupText callbackQuery',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
