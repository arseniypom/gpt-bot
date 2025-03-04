import { SubscriptionLevel, SubscriptionData } from './types/types';

export const SUBSCRIPTIONS: Record<SubscriptionLevel, SubscriptionData> = {
  FREE: {
    basicRequestsPerWeek: 20,
    basicRequestsPerDay: 0,
    proRequestsPerMonth: 0,
    imageGenerationPerMonth: 0,
    price: 0,
    description: '20 базовых запросов к нейросети в неделю',
    title: 'Бесплатный',
    icon: '🆓',
  },
  START: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 50,
    proRequestsPerMonth: 10,
    imageGenerationPerMonth: 10,
    price: 149,
    description:
      '50 базовых запросов в день, 10 PRO запросов в месяц и 10 генераций изображений в месяц на 1 месяц',
    title: 'Стартовый',
    icon: '🐥',
    duration: {
      months: 1,
    },
  },
  OPTIMUM: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 100,
    proRequestsPerMonth: 100,
    imageGenerationPerMonth: 20,
    price: 399,
    description:
      '100 базовых запросов в день, 100 PRO запросов в месяц и 20 генераций изображений в месяц на 1 месяц',
    title: 'Оптимум',
    icon: '🚀',
    duration: {
      months: 1,
    },
  },
  OPTIMUM_TRIAL: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 100,
    proRequestsPerMonth: 100,
    imageGenerationPerMonth: 20,
    price: 1,
    description:
      '100 базовых запросов в день, 100 PRO запросов и 20 генераций изображений на 3 дня',
    title: 'Оптимум пробный',
    icon: '🤩 🚀',
    duration: {
      days: 3,
    },
  },
  PREMIUM: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 1000,
    proRequestsPerMonth: 300,
    imageGenerationPerMonth: 50,
    price: 699,
    description:
      'Безлимитные базовые запросы, 300 PRO запросов в месяц и 50 генераций изображений в месяц на 1 месяц',
    title: 'Премиум',
    icon: '🔥',
    duration: {
      months: 1,
    },
  },
  ULTRA: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 1000,
    proRequestsPerMonth: 1000,
    imageGenerationPerMonth: 100,
    price: 1399,
    description:
      'Безлимитные базовые и PRO запросы, 100 генераций изображений в месяц на 1 месяц',
    title: 'Ультра',
    icon: '💎',
    duration: {
      months: 1,
    },
  },
};
