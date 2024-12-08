import 'dotenv/config';
import { MyContext } from '../types/types';
import User from '../../db/User';
import Chat from '../../db/Chat';
import Message from '../../db/Message';
import logger from '../utils/logger';
import { logError } from '../utils/utilFunctions';
import AdCampaign from '../../db/AdCampaign';

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

export const getStats = async (ctx: MyContext) => {
  if (!ADMIN_TELEGRAM_ID) {
    logError({
      message: 'ADMIN_TELEGRAM_ID is not set in the environment variables',
    });
    return;
  }

  if (!ctx.from || ctx.from.id !== Number(ADMIN_TELEGRAM_ID)) {
    await ctx.reply('Доступ ограничен');
    return;
  }
  try {
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlockedBot: true });
    const paidUsers = await User.countDocuments({
      subscriptionLevel: { $ne: 'FREE' },
    });

    let message = `👥 Total users: ${totalUsers}\n`;
    message += `💸: ${paidUsers} | ✅: ${
      totalUsers - blockedUsers
    } | 🚫: ${blockedUsers}\n\n`;

    const lastFiveUsers = await User.find().sort({ createdAt: -1 }).limit(5);

    for (const user of lastFiveUsers) {
      let username;
      if (user.userName) {
        username = `@${user.userName}`;
      } else if (user.firstName) {
        username = user.firstName;
      } else {
        username = user.id;
      }

      const chats = await Chat.find({ userId: user._id });

      let messageCount = 0;
      for (const chat of chats) {
        const count = await Message.countDocuments({ chatId: chat._id });
        messageCount += count;
      }
      const isBlocked = user.isBlockedBot ? '🚫' : '';
      message += `👤${isBlocked} ${username} | ${messageCount}\n`;
    }

    const adCampaigns = await AdCampaign.find();
    message += `\n📊 Ad Campaigns:\n`;
    for (const campaign of adCampaigns) {
      message += `📢 ${campaign.name}:\n`;
      message += `  - Reg: ${campaign.stats.registeredUsers} | Tok: ${campaign.stats.tokensBought} | Trial: ${campaign.stats.trialsBought} | Sub: ${campaign.stats.subsBought}\n`;
    }

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [[{ text: '✖︎', callback_data: 'hide' }]],
      },
    });
  } catch (error) {
    await ctx.reply('Произошла ошибка при получении статистики.');
    logger.error('Error in /stats:', error);
  }
};
