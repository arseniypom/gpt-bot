import { AiModels } from './types'

export const isValidAiModel = (model: unknown): model is keyof typeof AiModels => {
  return typeof model === 'string' && model in AiModels;
};