import { InlineKeyboard } from 'grammy';
import { generateImage } from './utils/gpt';
import logger from './logger';
import { type MyConversation, type MyContext } from './types/types';

const inlineKeyboard = new InlineKeyboard()
  .text("Отменить ❌", "cancelImageGeneration");

export async function imageConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Опишите, что должно быть на изображении (промпт для генерации):", {
    reply_markup: inlineKeyboard,
  });
  const { message } = await conversation.wait();
  console.log(message);
  if (message?.text) {

    const responseMessage = await ctx.reply('Генерация изображения...');

    try {
      const imageUrl = await generateImage(message.text);
      if (!imageUrl) {
        await ctx.reply('Произошла ошибка при генерации изображения. Пожалуйста, попробуйте позже или обратитесь в поддержку.');
        return;
      }
      await responseMessage.editText('Готово!');
      await ctx.replyWithPhoto(imageUrl);
    } catch (error) {
      await ctx.reply('Произошла ошибка при генерации изображения. Пожалуйста, попробуйте позже или обратитесь в поддержку.');
      logger.error('Error in /image command:', error);
    }
  }

  return await ctx.reply('Текст не получен, генерация отменена');
}