import 'dotenv/config';

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

export const getMongoDbUri = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return process.env.MONGO_DB_URI_PROD;
    default:
      return process.env.MONGO_DB_URI_DEV;
  }
};
