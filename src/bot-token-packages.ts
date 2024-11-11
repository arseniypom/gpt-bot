import { TokenPackageData, TokenPackageName } from './types/types';

export const TOKEN_PACKAGES: Record<TokenPackageName, TokenPackageData> = {
  token1: {
    tokensNumber: 30,
    price: 129,
    description: '30 токенов за 129₽',
    title: '30 токенов',
  },
  token2: {
    tokensNumber: 100,
    price: 399,
    description: '100 токенов за 399₽',
    title: '100 токенов',
  },
  token3: {
    tokensNumber: 200,
    price: 699,
    description: '200 токенов за 699₽',
    title: '200 токенов',
  },
};
