import { SubscriptionLevel, SubscriptionData } from './types/types';

export const SUBSCRIPTIONS: Record<SubscriptionLevel, SubscriptionData> = {
  FREE: {
    basicRequestsPerDay: 3,
    proRequestsPerDay: 0,
    imageGenerationPerDay: 0,
    price: 0,
    description: '3 базовых запроса к нейросети в день',
    title: 'Бесплатный',
    icon: '🆓',
  },
  MINI: {
    basicRequestsPerDay: 10,
    proRequestsPerDay: 0,
    imageGenerationPerDay: 0,
    price: 99,
    description: '10 базовых запросов к нейросети в день на 1 месяц',
    title: 'Мини',
    icon: '🐥',
    duration: {
      months: 1,
    },
  },
  BASIC: {
    basicRequestsPerDay: 25,
    proRequestsPerDay: 3,
    imageGenerationPerDay: 1,
    price: 499,
    description:
      '25 базовых запросов, 3 PRO запросов и 1 генерация изображения в день на 1 месяц',
    title: 'Базовый',
    icon: '🚀',
    duration: {
      months: 1,
    },
  },
  PRO: {
    basicRequestsPerDay: 60,
    proRequestsPerDay: 10,
    imageGenerationPerDay: 3,
    price: 999,
    description:
      '60 базовых запросов, 10 PRO запросов и 3 генерации изображений в день на 1 месяц',
    title: 'PRO',
    icon: '🔥',
    duration: {
      months: 1,
    },
  },
  ULTIMATE: {
    basicRequestsPerDay: 100,
    proRequestsPerDay: 20,
    imageGenerationPerDay: 5,
    price: 1499,
    description:
      '100 базовых запросов, 20 PRO запросов и 5 генераций изображений в день на 1 месяц',
    title: 'ULTIMATE',
    icon: '💎',
    duration: {
      months: 1,
    },
  },
};
