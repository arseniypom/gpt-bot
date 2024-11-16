import { SubscriptionLevel, SubscriptionData } from './types/types';

export const SUBSCRIPTIONS: Record<SubscriptionLevel, SubscriptionData> = {
  FREE: {
    basicRequestsPerWeek: 15,
    basicRequestsPerDay: 0,
    proRequestsPerMonth: 0,
    imageGenerationPerMonth: 0,
    price: 0,
    description: '15 базовых запросов к нейросети в неделю',
    title: 'Бесплатный',
    icon: '🆓',
  },
  START: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 20,
    proRequestsPerMonth: 0,
    imageGenerationPerMonth: 10,
    price: 149,
    description:
      '20 базовых запросов в день и 10 генераций изображений в месяц на 1 месяц',
    title: 'Стартовый',
    icon: '🐥',
    duration: {
      months: 1,
    },
  },
  OPTIMUM: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 50,
    proRequestsPerMonth: 50,
    imageGenerationPerMonth: 20,
    price: 399,
    description:
      '50 базовых запросов в день, 50 PRO запросов и 20 генераций изображений в месяц на 1 месяц',
    title: 'Оптимум',
    icon: '🚀',
    duration: {
      months: 1,
    },
  },
  PREMIUM: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 100,
    proRequestsPerMonth: 100,
    imageGenerationPerMonth: 30,
    price: 699,
    description:
      '100 базовых запросов в день, 100 PRO запросов и 30 генераций изображений в месяц на 1 месяц',
    title: 'Премиум',
    icon: '🔥',
    duration: {
      months: 1,
    },
  },
  ULTRA: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 300,
    proRequestsPerMonth: 300,
    imageGenerationPerMonth: 50,
    price: 1399,
    description:
      '300 базовых запросов в день, 300 PRO запросов и 50 генераций изображений в месяц на 1 месяц',
    title: 'Ультра',
    icon: '💎',
    duration: {
      months: 1,
    },
  },
  OPTIMUM_TRIAL: {
    basicRequestsPerWeek: 0,
    basicRequestsPerDay: 50,
    proRequestsPerMonth: 50,
    imageGenerationPerMonth: 20,
    price: 399,
    description:
      '50 базовых запросов в день, 50 PRO запросов и 20 генераций изображений в месяц на 1 месяц',
    title: 'Оптимум',
    icon: '🚀',
    duration: {
      days: 3,
    },
  },
};
