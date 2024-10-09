import { InlineKeyboard } from 'grammy';
import { generateImage } from '../utils/gpt';
import { logError } from '../utils/alert';
import { type MyConversation, type MyContext } from '../types/types';

const cancelKeyboard = new InlineKeyboard().text(
  'Отменить ❌',
  'cancelImageGeneration',
);

export async function imageConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  await ctx.reply('Опишите, что должно быть на изображении?', {
    reply_markup: cancelKeyboard,
  });

  const { message } = await conversation.waitFor('message:text');

  const responseMessage = await ctx.reply('Генерация изображения...');

  try {
    const imageUrl = await generateImage(
      message.text,
      ctx.session.imageQuality,
    );
    if (!imageUrl) {
      throw new Error('Image generation failed: no image URL');
    }
    await ctx.replyWithPhoto(imageUrl);
    await responseMessage.editText('Готово!');
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при генерации изображения. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in /image command:', error);
  }

  return;
}
