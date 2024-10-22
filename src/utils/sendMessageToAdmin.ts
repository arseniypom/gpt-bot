import 'dotenv/config';
import bot from '../../bot';
import { logError } from './alert';

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

export const sendMessageToAdmin = async (message: string) => {
  try {
    if (ADMIN_TELEGRAM_ID) {
      await bot.api.sendMessage(ADMIN_TELEGRAM_ID, message);
    } else {
      throw new Error(
        'ADMIN_TELEGRAM_ID is not set in the environment variables.',
      );
    }
  } catch (error) {
    logError('Failed to send message to admin:', error);
  }
};
