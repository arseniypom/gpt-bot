import cron from 'node-cron';
import dayjs from 'dayjs';
import bot from '../../bot';
import User from '../../db/User';
import { logError, setUserBlocked } from '../utils/utilFunctions';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import { profileAddSubscriptionKeyboard } from '../commands/myProfile';
import { GrammyError } from 'grammy';

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000;

// Schedule the task to run every day at 22:00 UTC
cron.schedule('17 13 * * *', async () => {
  console.log('Current time:', dayjs().format('HH:mm'));
  console.log('running refresh requests cron job');

  try {
    const users = await User.find();
    const totalUsers = users.length;
    console.log('totalUsers', totalUsers);

    let processedUsers = 0;
    let usersUpdated = 0;
    let basicRequestsPerDayUpdated = 0;
    let basicRequestsPerWeekUpdated = 0;

    while (processedUsers < totalUsers) {
      console.log('processedUsers', processedUsers);
      console.log('-------------------------');

      const batch = users.slice(processedUsers, processedUsers + BATCH_SIZE);
      console.log('batch.length', batch.length);
      console.log('-------------------------');

      for (const user of batch) {
        const subscriptionData = SUBSCRIPTIONS[user.subscriptionLevel];
        if (processedUsers % 100 === 0) {
          console.log('processedUsers % 100 === 0', processedUsers);
          console.log('-------------------------');
        }
        if (subscriptionData.basicRequestsPerDay) {
          user.basicRequestsLeftToday =
            subscriptionData.basicRequestsPerDay || 0;
          usersUpdated++;
          basicRequestsPerDayUpdated++;
        }
        if (subscriptionData.basicRequestsPerWeek) {
          if (
            dayjs().isSame(user.weeklyRequestsExpiry, 'day') ||
            dayjs().isAfter(user.weeklyRequestsExpiry, 'day')
          ) {
            user.basicRequestsLeftThisWeek =
              subscriptionData.basicRequestsPerWeek;
            user.weeklyRequestsExpiry = dayjs().add(7, 'day').toDate();
            await bot.api.sendMessage(
              user.telegramId,
              `*Ваша недельная квота запросов обновилась ✔️ *\n\nНачислено *${subscriptionData.basicRequestsPerWeek} запросов к базовой модели*`,
              {
                parse_mode: 'MarkdownV2',
                reply_markup: profileAddSubscriptionKeyboard,
              },
            );
            usersUpdated++;
            basicRequestsPerWeekUpdated++;
          }
        }
        await user.save();
      }

      processedUsers += BATCH_SIZE;
      console.log(`Processed ${processedUsers} of ${totalUsers} users`);

      if (processedUsers < totalUsers) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(`Updated ${usersUpdated} users`);
    console.log('-------------------------');
    console.log('basicRequestsPerDayUpdated', basicRequestsPerDayUpdated);
    console.log('basicRequestsPerWeekUpdated', basicRequestsPerWeekUpdated);
    console.log('-------------------------');
  } catch (error) {
    if (
      error instanceof GrammyError &&
      error.error_code === 403 &&
      /block/.test(error.description)
    ) {
      await setUserBlocked(error.payload.chat_id as number);
      return;
    }
    logError({
      message: 'Error fetching users',
      error,
    });
  }
});
