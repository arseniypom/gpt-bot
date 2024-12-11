import 'dotenv/config';
import { MyContext } from '../types/types';
import User from '../../db/User';
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
    const responseMessage = await ctx.reply('🔍 Loading...');
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlockedBot: true });
    const paidUsers = await User.countDocuments({
      subscriptionLevel: { $ne: 'FREE' },
    });

    let message = `👥 Total users: ${totalUsers}\n💸: ${paidUsers}\n✅: ${
      totalUsers - blockedUsers
    } | 🚫: ${blockedUsers}\n\n`;

    const topUsers = await User.aggregate([
      {
        $addFields: {
          totalReqs: {
            $add: [
              '$stats.basicReqsMade',
              '$stats.proReqsMade',
              '$stats.imgGensMade',
            ],
          },
        },
      },
      { $sort: { totalReqs: -1 } },
      { $limit: 7 },
    ]);

    message += `\nTop 7\n`;
    for (const user of topUsers) {
      let username;
      if (user.userName) {
        username = `@${user.userName}`;
      } else if (user.firstName) {
        username = user.firstName;
      } else {
        username = user.id;
      }

      const { basicReqsMade, proReqsMade, imgGensMade } = user.stats;
      const isBlocked = user.isBlockedBot ? '🚫' : '';
      message += `👤${isBlocked}: ${basicReqsMade}, ${proReqsMade}, ${imgGensMade} ${username}\n`;
    }

    const lastRegisteredUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    message += `\nLast 5\n`;
    for (const user of lastRegisteredUsers) {
      let username;
      if (user.userName) {
        username = `@${user.userName}`;
      } else if (user.firstName) {
        username = user.firstName;
      } else {
        username = user.id;
      }

      const { basicReqsMade, proReqsMade, imgGensMade } = user.stats;
      const isBlocked = user.isBlockedBot ? '🚫' : '';
      message += `👤${isBlocked}: ${basicReqsMade}, ${proReqsMade}, ${imgGensMade} ${username}\n`;
    }

    const adCampaigns = await AdCampaign.find();
    message += `\n📊 Ads:\n`;

    adCampaigns.sort(
      (a, b) => b.stats.registeredUsers - a.stats.registeredUsers,
    );

    for (const campaign of adCampaigns) {
      const { registeredUsers, tokensBought, trialsBought, subsBought } =
        campaign.stats;

      if (
        registeredUsers === 0 &&
        tokensBought === 0 &&
        trialsBought === 0 &&
        subsBought === 0
      ) {
        continue;
      }

      message += `→ ${campaign.name}:\n`;
      message += `  Reg: ${registeredUsers} Tok: ${tokensBought} Trial: ${trialsBought} Sub: ${subsBought}\n`;
    }

    await responseMessage.editText(message, {
      reply_markup: {
        inline_keyboard: [[{ text: '⨯', callback_data: 'hide' }]],
      },
    });
  } catch (error) {
    await ctx.reply('Произошла ошибка при получении статистики.');
    logger.error('Error in /stats:', error);
  }
};
