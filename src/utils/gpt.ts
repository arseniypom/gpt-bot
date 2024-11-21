import OpenAI from 'openai';
import 'dotenv/config';
import { IMessage } from '../../db/Message';
import {
  AiModel,
  AiModels,
  ChatMode,
  ImageGenerationQuality,
} from '../types/types';
import { isValidAiModel } from '../types/typeguards';
import {
  DEFAULT_AI_MODEL,
  PROMPT_MESSAGE_BASE,
  PROMPT_MESSAGE_DIALOG_MODE_POSTFIX,
  PROMPT_MESSAGE_BASIC_MODE_POSTFIX,
} from './consts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const answerWithChatGPT = async ({
  chatHistory,
  telegramId,
  chatMode,
  modelName = DEFAULT_AI_MODEL,
}: {
  chatHistory: IMessage[];
  telegramId: number;
  chatMode: ChatMode;
  modelName?: AiModel;
}): Promise<string | null> => {
  const formattedHistoryMessages = chatHistory.map((msg) => ({
    role: msg.role as 'system' | 'user' | 'assistant',
    content: [{ type: 'text', text: msg.content }] as [
      { type: 'text'; text: string },
    ],
  }));

  if (!isValidAiModel(modelName)) {
    throw new Error('Invalid model name');
  }

  let prompt = PROMPT_MESSAGE_BASE;
  switch (chatMode) {
    case 'dialogue':
      prompt += PROMPT_MESSAGE_DIALOG_MODE_POSTFIX;
      break;
    case 'basic':
      prompt += PROMPT_MESSAGE_BASIC_MODE_POSTFIX;
      break;
    default:
      break;
  }

  try {
    const response = await openai.chat.completions.create({
      model: AiModels[modelName],
      messages: [
        { role: 'system', content: [{ type: 'text', text: prompt }] },
        ...formattedHistoryMessages,
      ],
      user: telegramId.toString(),
    });

    return response.choices[0].message.content;
  } catch (error) {
    const err = error as Error;
    throw err;
  }
};

export const generateImage = async (
  prompt: string,
  quality: ImageGenerationQuality = ImageGenerationQuality.STANDARD,
): Promise<string | undefined> => {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    quality: quality,
    prompt,
    n: 1,
    size: '1024x1024',
  });

  return response.data[0].url;
};
