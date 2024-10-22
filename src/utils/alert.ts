import 'dotenv/config';
import bot from '../../bot';
import logger from './logger';
import { sendMessageToAdmin } from './sendMessageToAdmin';

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

export function logError(message: string, error?: unknown) {
  logger.error(message, error);

  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = `${message}: ${error.stack || error.message}`;
  } else {
    errorMessage = `${message}: ${String(error)}`;
  }

  sendMessageToAdmin(`Unknown error: ${errorMessage}`);
}
