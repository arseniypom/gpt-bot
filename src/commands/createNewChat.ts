import { User as TelegramUser } from '@grammyjs/types';
import { logError } from '../utils/utilFunctions';
import { MyContext } from '../types/types';
import User from '../../db/User';
import Chat from '../../db/Chat';
import { SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';

export const createNewChat = async (ctx: MyContext) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    const chat = await Chat.create({
      userId: user._id,
    });

    ctx.session.chatId = chat._id.toString();

    await ctx.reply('Новый чат создан ✅\nПожалуйста, введите запрос');
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при создании нового чата. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in /newchat command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
