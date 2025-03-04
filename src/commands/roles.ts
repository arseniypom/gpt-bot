import { User as TelegramUser } from '@grammyjs/types';
import { CallbackQueryContext } from 'grammy';
import {
  AssistantRoleLabels,
  AssistantRole,
  MyContext,
  SubscriptionLevels,
} from '../types/types';
import User from '../../db/User';
import {
  SUPPORT_MESSAGE_POSTFIX,
  ROLES_DESCRIPTION_MESSAGE,
} from '../utils/consts';
import { logError } from '../utils/utilFunctions';
import { InlineKeyboard } from 'grammy';
import { getSubscriptionLevelsKeyboard } from './subscription';
import { addSubscriptionKeyboard } from '../conversations/imageConversation';
import { addSubscriptionKeyboardWithTrial } from '../conversations/imageConversation';

const getRolesKeyboard = (
  activeRole: AssistantRole | undefined,
  isFreeUser: boolean,
) => {
  const rolesBtns = Object.entries(AssistantRoleLabels).map(([name, label]) => {
    switch (name) {
      case 'translator':
        if (isFreeUser) {
          return [`🔒 ${label}`, name];
        } else if (activeRole === 'translator') {
          return [`✅ ${label}`, name];
        } else {
          return [label, name];
        }
      case 'general':
      default:
        if (activeRole === 'general' || !activeRole) {
          return [`✅ ${label}`, name];
        } else {
          return [label, name];
        }
    }
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
    const isFreeUser = user.subscriptionLevel === SubscriptionLevels.FREE;
    await ctx.callbackQuery.message?.editText(ROLES_DESCRIPTION_MESSAGE, {
      reply_markup: getRolesKeyboard(role, isFreeUser),
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
    const isFreeUser = user.subscriptionLevel === SubscriptionLevels.FREE;

    if (isFreeUser && role !== 'general') {
      let keyboard;
      if (user.canActivateTrial) {
        keyboard = addSubscriptionKeyboardWithTrial;
      } else {
        keyboard = addSubscriptionKeyboard;
      }

      await ctx.reply(
        `*Роль ${AssistantRoleLabels[role]} доступна только для пользователей с подпиской 🔒*\n\nПользуйтесь ботом без ограничений – оформите подписку по цене чашки кофе или дешевле\\! ☕`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: keyboard,
        },
      );
      return;
    }

    if (role === user.assistantRole) {
      return;
    }

    user.assistantRole = role;
    await user.save();

    await ctx.callbackQuery.message?.editText(ROLES_DESCRIPTION_MESSAGE, {
      reply_markup: getRolesKeyboard(role, isFreeUser),
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
