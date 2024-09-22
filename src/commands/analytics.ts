import { MyContext } from '../types/types';
import User from '../../db/User';
import Chat from '../../db/Chat';
import Message from '../../db/Message';
import logger from '../../logger';

export const getAnalytics = async (ctx: MyContext) => {
  const adminId = 265162348;

  if (!ctx.from || ctx.from.id !== adminId) {
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

      message += `👤 : ${username}\n`;
      message += `✉️ : ${messageCount}\n\n`;
    }

    await ctx.reply(message);
  } catch (error) {
    await ctx.reply('Произошла ошибка при получении статистики.');
    logger.error('Error in /stats:', error);
  }
};
