import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { AiModels, AiModelsLabels, MyContext } from '../types/types';
import User from '../../db/User';

export const getModelsKeyboard = (activeModel: AiModelsLabels) => {
  const labelDataPairs = Object.entries(AiModelsLabels).map(([name, label]) => {
    const isActive = activeModel === label;
    const labelText = isActive ? `${label} ✅` : label;
    return [labelText, name];
  });
  const buttonRows = labelDataPairs.map(([label, data]) => [
    InlineKeyboard.text(label, data),
  ]);
  return InlineKeyboard.from(buttonRows);
};

export const changeModel = async (
  ctx: CallbackQueryContext<MyContext> | MyContext,
) => {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }

  const user = await User.findOne({ telegramId: ctx.from?.id });
  if (!user) {
    await ctx.reply('Пожалуйста, начните с команды /start.');
    return;
  }
  const activeModel = AiModelsLabels[user.selectedModel];

  await ctx.reply(
    `Текущая модель: ${activeModel}\nВыберите модель, на которую хотите переключиться:`,
    {
      reply_markup: getModelsKeyboard(activeModel),
    },
  );
};
