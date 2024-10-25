import axios from 'axios';
import {
  getYookassaShopId,
  getYookassaApiKey,
  logError,
} from './utilFunctions';
import { ICreatePayment } from '../types/yookassaTypes';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';
const SHOP_ID = getYookassaShopId();
const SECRET_KEY = getYookassaApiKey();

if (!SHOP_ID || !SECRET_KEY) {
  throw new Error('YOOKASSA_SHOP_ID or YOOKASSA_API_KEY is not defined');
}

const axiosInstance = axios.create({
  baseURL: YOOKASSA_API_URL,
  auth: {
    username: SHOP_ID,
    password: SECRET_KEY,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Creates a payment with Yookassa.
 * @param payload Payment data payload.
 * @param idempotenceKey Unique identifier for idempotency.
 * @returns Payment object from Yookassa.
 */
export const createPayment = async (
  payload: ICreatePayment,
  idempotenceKey: string,
) => {
  try {
    console.log('Sending payment request:', {
      url: `${YOOKASSA_API_URL}/payments`,
      method: 'POST',
      auth: {
        username: SHOP_ID,
        password: SECRET_KEY,
      },
      headers: {
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      },
      data: payload,
    });

    const response = await axiosInstance.post('/payments', payload, {
      headers: {
        'Idempotence-Key': idempotenceKey,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      logError('Error creating Yookassa payment:', {
        message: error.message,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      logError('Error creating Yookassa payment:', error);
    }
    throw error;
  }
};

// Add other necessary Yookassa API methods here (e.g., refunds, captures)

export default {
  createPayment,
};
