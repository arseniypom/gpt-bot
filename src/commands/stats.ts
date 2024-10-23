import 'dotenv/config';
import { MyContext } from '../types/types';
import User from '../../db/User';
import Chat from '../../db/Chat';
import Message from '../../db/Message';
import logger from '../utils/logger';
import { logError } from '../utils/alert';

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

export const getStats = async (ctx: MyContext) => {
  if (!ADMIN_TELEGRAM_ID) {
    logError('ADMIN_TELEGRAM_ID is not set in the environment variables.');
    return;
  }

  if (!ctx.from || ctx.from.id !== Number(ADMIN_TELEGRAM_ID)) {
    await ctx.reply('Доступ ограничен');
    return;
  }
  try {
    const totalUsers = await User.countDocuments();

    const users = await User.find();

    let message = `📊 Статистика:\n\n`;
    message += `👥 Всего пользователей: ${totalUsers}\n\n`;

    for (const user of users) {
      const username = user.userName || user.firstName || 'Без имени';

      const chats = await Chat.find({ userId: user._id });

      let messageCount = 0;

      for (const chat of chats) {
        const count = await Message.countDocuments({ chatId: chat._id });
        messageCount += count;
      }

      message += `👤 : @${username}\n`;
      message += `✉️ : ${messageCount}\n\n`;
    }

    await ctx.reply(message);
  } catch (error) {
    await ctx.reply('Произошла ошибка при получении статистики.');
    logger.error('Error in /stats:', error);
  }
};
