import { NextFunction } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { logError } from './alert';
import { MyContext } from '../types/types';
import { isMyContext } from '../types/typeguards';

export const checkUserInDB = async (
  ctx: MyContext | unknown,
  next: NextFunction,
): Promise<void> => {
  if (!isMyContext(ctx) || ctx.hasCommand('start')) {
    await next();
    return;
  }

  const { id } = ctx.from as TelegramUser;

  if (ctx.session.user) {
    await next();
    return;
  }

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }

    ctx.session.user = user;
    await next();
  } catch (error) {
    logError('Error checking user existence:', error);
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};
