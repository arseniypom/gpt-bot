import 'dotenv/config';
import bot from '../../bot';
import logger from './logger';

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

export function logError(message: string, error?: unknown) {
  logger.error(message, error);

  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = `${message}: ${error.stack || error.message}`;
  } else {
    errorMessage = `${message}: ${String(error)}`;
  }

  if (ADMIN_TELEGRAM_ID) {
    bot.api
      .sendMessage(ADMIN_TELEGRAM_ID, `Unknown error: ${errorMessage}`)
      .catch((err) => {
        logger.error('Failed to send error message to admin:', err);
      });
  } else {
    logger.warn('ADMIN_TELEGRAM_ID is not set in the environment variables.');
  }
}
