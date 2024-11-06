import { SubscriptionLevel, SubscriptionData } from './types/types';

export const SUBSCRIPTIONS: Record<SubscriptionLevel, SubscriptionData> = {
  FREE: {
    basicRequestsPerDay: 3,
    price: 0,
    description: '3 базовых запроса к нейросети в день',
    title: 'Бесплатный',
    icon: '🆓',
  },
  BASIC: {
    basicRequestsPerDay: 20,
    proRequestsPerDay: 3,
    price: 499,
    description: '20 базовых и 3 PRO запросов к нейросети в день на 1 месяц',
    title: 'Базовый',
    icon: '🚀',
  },
  PRO: {
    basicRequestsPerDay: 50,
    proRequestsPerDay: 10,
    imageGenerationPerDay: 3,
    price: 999,
    description: '50 базовых запросов, 10 PRO запросов и 3 генерации изображений в день на 1 месяц',
    title: 'PRO',
    icon: '💎',
  },
  ULTIMATE: {
    basicRequestsPerDay: 100,
    proRequestsPerDay: 20,
    imageGenerationPerDay: 5,
    price: 1499,
    description: '100 базовых запросов, 20 PRO запросов и 5 генераций изображений в день на 1 месяц',
    title: 'ULTIMATE',
    icon: '🤩',
  },
};
