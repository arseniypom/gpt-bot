import { generateImage } from './utils/gpt';
import logger from './logger';
import { type MyConversation, type MyContext } from './types/types';

export async function imageConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Введите описание изображения (промпт для генерации)");
  const { message } = await conversation.wait();
  if (!message?.text) {
    await ctx.reply('Введите описание изображения текстом');
    return;
  }
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

  return;
}