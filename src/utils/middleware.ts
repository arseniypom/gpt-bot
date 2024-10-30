import { NextFunction } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { logError } from './utilFunctions';
import { MyContext } from '../types/types';
import { isMyContext } from '../types/typeguards';
import logger from './logger';

export const checkUserInDB = async (
  ctx: MyContext | unknown,
  next: NextFunction,
): Promise<void> => {
  if (
    !isMyContext(ctx) ||
    ctx.hasCommand('start') ||
    ctx.hasCommand('support') ||
    ctx.callbackQuery?.data === 'checkSubscriptionAndRegisterUser'
  ) {
    await next();
    return;
  }

  const { id } = ctx.from as TelegramUser;

  if (ctx.session.user) {
    await next();
    return;
  }

  try {
    const user = await User.findOne({ telegramId: id }).lean();
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }

    ctx.session.user = user;
    await next();
  } catch (error) {
    logError({
      message: 'Error checking user existence middleware',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

export const ignoreOld = async (
  ctx: MyContext,
  next: NextFunction,
): Promise<void> => {
  // 5 mins threshold
  const threshold = 5 * 60;
  if (
    !ctx.callbackQuery &&
    ctx.msg?.date &&
    new Date().getTime() / 1000 - ctx.msg.date > threshold
  ) {
    logger.info(
      `Ignoring message | TEXT: '${ctx.msg.text}' | USER ID: '${
        ctx.from?.id
      }' | CHAT ID: '${ctx.chat?.id}' (${new Date().getTime() / 1000}:${
        ctx.msg.date
      })`,
    );
    return;
  }
  await next();
};
