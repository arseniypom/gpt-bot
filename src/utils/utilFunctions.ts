import 'dotenv/config';
import bot from '../../bot';
import logger from './logger';

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

export const sendMessageToAdmin = async (message: string) => {
  try {
    if (ADMIN_TELEGRAM_ID) {
      await bot.api.sendMessage(ADMIN_TELEGRAM_ID, message);
    } else {
      throw new Error(
        'ADMIN_TELEGRAM_ID is not set in the environment variables',
      );
    }
  } catch (error) {
    logger.error('Failed to send message to admin:', error);
  }
};

export const getBotApiKey = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return process.env.BOT_API_KEY_PROD;
    case 'development':
      return process.env.BOT_API_KEY_DEV;
    default:
      return process.env.BOT_API_KEY_LOCAL;
  }
};

export const getYookassaPaymentProviderToken = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return process.env.YOOKASSA_PAYMENT_PROVIDER_TOKEN_PROD;
    default:
      return process.env.YOOKASSA_PAYMENT_PROVIDER_TOKEN_DEV;
  }
};

export const getYookassaShopId = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return process.env.YOOKASSA_SHOP_ID_PROD;
    default:
      return process.env.YOOKASSA_SHOP_ID_DEV;
  }
};

export const getYookassaApiKey = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return process.env.YOOKASSA_API_KEY_PROD;
    default:
      return process.env.YOOKASSA_API_KEY_DEV;
  }
};

export const getMongoDbUri = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return process.env.MONGO_DB_URI_PROD;
    default:
      return process.env.MONGO_DB_URI_DEV;
  }
};

export function logError({
  message,
  username,
  telegramId,
  error,
}: {
  message: string;
  username?: string;
  telegramId?: number;
  error?: unknown;
}) {
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = `${message}: ${error.stack || error.message}`;
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = `${message}: ${JSON.stringify(error)}`;
  } else {
    errorMessage = `${message}: ${String(error)}`;
  }

  logger.error(`tgId: ${telegramId} | ${errorMessage}`, error);
  sendMessageToAdmin(`
    ❗❗ ERROR ❗❗
    
    Username: @${username}
    tgId: ${telegramId}
    Message: "${errorMessage}"
        `);
}
