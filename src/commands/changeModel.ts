import { InlineKeyboard } from 'grammy';
import { AiModelsLabels, MyContext } from '../src/types/types';

const labelDataPairs = Object.entries(AiModelsLabels).map(([name, label]) => [label, name]);
const buttonRows = labelDataPairs
  .map(([label, data]) => [InlineKeyboard.text(label, data)]);
const keyboard = InlineKeyboard.from(buttonRows);

export const changeModel = async (ctx: MyContext) => {
  await ctx.reply('Выберите модель:', {
    reply_markup: keyboard,
  });
};