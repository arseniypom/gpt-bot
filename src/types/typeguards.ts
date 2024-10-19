import { AiModel, AiModels, ImageGenerationQuality, MyContext } from './types';

export const isValidAiModel = (model: unknown): model is AiModel => {
  return typeof model === 'string' && model in AiModels;
};

export const isValidImageGenerationQuality = (
  quality: unknown,
): quality is ImageGenerationQuality => {
  return Object.values(ImageGenerationQuality).includes(
    quality as ImageGenerationQuality,
  );
};

export const isMyContext = (ctx: unknown): ctx is MyContext => {
  return typeof ctx === 'object' && ctx !== null && 'session' in ctx;
};
