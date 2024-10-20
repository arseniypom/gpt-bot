import { PackageName, PackageData } from './types/types';

export const PACKAGES: Record<PackageName, PackageData> = {
  req1: {
    basicRequestsBalance: 100,
    price: 99,
    description: '100 базовых запросов к нейросети за 99₽',
    title: '100 запросов',
  },
  req2: {
    basicRequestsBalance: 500,
    price: 299,
    description: '500 базовых запросов к нейросети за 299₽',
    title: '500 запросов',
  },
  req3: {
    basicRequestsBalance: 950,
    proRequestsBalance: 50,
    price: 599,
    description: '950 базовых запросов и 50 ПРО запросов к нейросети за 599₽',
    title: '1000 запросов',
  },
  img1: {
    imageGenerationBalance: 10,
    price: 119,
    description: 'Генерация 10 изображений за 119₽',
    title: '10 изображений',
  },
  img2: {
    imageGenerationBalance: 25,
    price: 259,
    description: 'Генерация 25 изображений за 259₽',
    title: '25 изображений',
  },
  img3: {
    imageGenerationBalance: 50,
    price: 449,
    description: 'Генерация 50 изображений за 449₽',
    title: '50 изображений',
  },
  combo1: {
    basicRequestsBalance: 100,
    imageGenerationBalance: 10,
    price: 179,
    description:
      '100 базовых запросов к нейросети и генерация 10 изображений за 179₽',
    title: '100 запросов + 10 изображений',
  },
  combo2: {
    basicRequestsBalance: 500,
    imageGenerationBalance: 25,
    price: 499,
    description:
      '500 базовых запросов к нейросети и генерация 25 изображений за 499₽',
    title: '500 запросов + 25 изображений',
  },
  combo3: {
    basicRequestsBalance: 950,
    proRequestsBalance: 50,
    imageGenerationBalance: 50,
    price: 899,
    description:
      '950 базовых запросов, 50 ПРО запросов к нейросети и генерация 50 изображений за 899₽',
    title: '1000 запросов + 50 изображений',
  },
};
