import 'dotenv/config';
import { InlineKeyboard } from 'grammy';
import { ImageGenerationQuality, MyContext } from '../types/types';

export const generateImage = async (ctx: MyContext) => {
  if (process.env.IMAGE_QUALITY_CHANGE_AVAILABLE !== 'true') {
    await ctx.conversation.enter('imageConversation');
    return;
  }
  const qualityKeyboard = new InlineKeyboard()
    .text('Standard', ImageGenerationQuality.STANDARD)
    .text('HD', ImageGenerationQuality.HD)
    .row()
    .text('❌ Отменить', 'cancelImageGeneration');

  await ctx.reply(
    `Выберите качество изображения:
    standard — стандартное
    hd — повышенная детализация`,
    {
      reply_markup: qualityKeyboard,
    },
  );
};
