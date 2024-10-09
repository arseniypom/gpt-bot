import { InlineKeyboard } from 'grammy';
import { AiModelsLabels, MyContext } from '../types/types';
import User from '../../db/User';

const labelDataPairs = Object.entries(AiModelsLabels).map(([name, label]) => [
  label,
  name,
]);
const buttonRows = labelDataPairs.map(([label, data]) => [
  InlineKeyboard.text(label, data),
]);
const keyboard = InlineKeyboard.from(buttonRows);

export const changeModel = async (ctx: MyContext) => {
  const user = await User.findOne({ telegramId: ctx.from?.id });
  if (!user) {
    await ctx.reply('Пожалуйста, начните с команды /start.');
    return;
  }

  await ctx.reply(
    `Текущая модель: ${user.selectedModel}\nВыберите модель, на которую хотите переключиться:`,
    {
      reply_markup: keyboard,
    },
  );
};
