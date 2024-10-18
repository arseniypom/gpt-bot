import { AiModel, AiModels, ImageGenerationQuality } from './types';

export const isValidAiModel = (model: unknown): model is AiModel => {
  return typeof model === 'string' && model in AiModels;
};

export const isValidImageGenerationQuality = (quality: unknown): quality is ImageGenerationQuality => {
  return Object.values(ImageGenerationQuality).includes(quality as ImageGenerationQuality);
};
