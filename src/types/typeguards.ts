import {
  AiModel,
  AiModels,
  ImageGenerationQuality,
  MyContext,
  SubscriptionLevel,
  SubscriptionLevels,
  SubscriptionDuration,
} from './types';

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

export const isValidSubscriptionLevel = (
  level: unknown,
): level is SubscriptionLevel => {
  return typeof level === 'string' && level in SubscriptionLevels;
};

export const isValidSubscriptionDuration = (
  duration: unknown,
): duration is SubscriptionDuration => {
  return (
    typeof duration === 'object' &&
    duration !== null &&
    ('days' in duration || 'months' in duration)
  );
};

export const isMyContext = (ctx: unknown): ctx is MyContext => {
  return typeof ctx === 'object' && ctx !== null && 'session' in ctx;
};
