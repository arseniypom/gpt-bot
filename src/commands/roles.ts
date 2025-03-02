import { User as TelegramUser } from '@grammyjs/types';
import { CallbackQueryContext } from 'grammy';
import { AssistantRoleLabels, AssistantRole, MyContext } from '../types/types';
import User from '../../db/User';
import {
  SUPPORT_MESSAGE_POSTFIX,
  ROLES_DESCRIPTION_MESSAGE,
} from '../utils/consts';
import { logError } from '../utils/utilFunctions';
import { InlineKeyboard } from 'grammy';

const getRolesKeyboard = (activeRole: AssistantRole | undefined) => {
  const rolesBtns = Object.entries(AssistantRoleLabels).map(([name, label]) => {
    let isActive = false;
    if (activeRole === name) {
      isActive = true;
    }
    const labelText = isActive ? `✅ ${label}` : `${label}`;
    return [labelText, name];
  });
  const rolesRow = rolesBtns.map(([label, data]) =>
    InlineKeyboard.text(label, data),
  );
  return InlineKeyboard.from([
    [...rolesRow],
    [InlineKeyboard.text('← Назад', 'backToSettings')],
  ]);
};

export const chooseRoleMenu = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }
    const role = user.assistantRole;
    await ctx.callbackQuery.message?.editText(ROLES_DESCRIPTION_MESSAGE, {
      reply_markup: getRolesKeyboard(role),
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при выборе роли. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in chooseRoleMenu command',
      error,
      telegramId: id,
      username: ctx.from?.username,
    });
  }
};

export const setRole = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }

    const role = ctx.callbackQuery.data as AssistantRole;

    if (role === user.assistantRole) {
      return;
    }

    user.assistantRole = role;
    await user.save();

    await ctx.callbackQuery.message?.editText(ROLES_DESCRIPTION_MESSAGE, {
      reply_markup: getRolesKeyboard(role),
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при выборе роли. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in chooseRole command',
      error,
      telegramId: id,
      username: ctx.from?.username,
    });
  }
};
