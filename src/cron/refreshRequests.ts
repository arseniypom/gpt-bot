import cron from 'node-cron';
import dayjs from 'dayjs';
import User from '../../db/User';
import { logError } from '../utils/utilFunctions';
import { SUBSCRIPTIONS } from '../bot-subscriptions';

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000;

// Schedule the task to run every day at 22:00 UTC
cron.schedule('0 22 * * *', async () => {
  console.log('Current time:', dayjs().format('HH:mm'));
  console.log('running refresh requests cron job');

  try {
    const users = await User.find();
    const totalUsers = users.length;
    let processedUsers = 0;

    while (processedUsers < totalUsers) {
      const batch = users.slice(processedUsers, processedUsers + BATCH_SIZE);

      for (const user of batch) {
        const subscriptionData = SUBSCRIPTIONS[user.subscriptionLevel];
        if (subscriptionData.basicRequestsPerDay) {
          user.basicRequestsLeftToday =
            subscriptionData.basicRequestsPerDay || 0;
        }
        if (subscriptionData.basicRequestsPerWeek) {
          if (dayjs().isSame(user.weeklyRequestsExpiry, 'day')) {
            user.basicRequestsLeftThisWeek =
              subscriptionData.basicRequestsPerWeek;
            user.weeklyRequestsExpiry = dayjs().add(7, 'day').toDate();
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
  } catch (error) {
    logError({
      message: 'Error fetching users',
      error,
    });
  }
});
