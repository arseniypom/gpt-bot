import OpenAI from 'openai';
import 'dotenv/config';
import { IMessage } from '../db/Message';
import { AiModels } from '../types/types';
import { isValidAiModel } from '../types/typeguards';
import { DEFAULT_AI_MODEL } from './consts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const answerWithChatGPT = async (
  messages: IMessage[],
  modelName: string = DEFAULT_AI_MODEL,
): Promise<string> => {
  const formattedMessages = messages.map((msg) => ({
    role: msg.role as 'system' | 'user' | 'assistant',
    content: msg.content,
  }));
  
  if (!isValidAiModel(modelName)) {
    throw new Error('Invalid model name');
  }

  try {
    const response = await openai.chat.completions.create({
      model: AiModels[modelName],
      messages: [
        { role: 'system', content: 'Ты полезный ассистент, отвечай кратко, форматируй текст тэгами <b>,i,s,<u>,<code>,<pre> и <blockquote> для лучшего отображения, символы начала ```html и конца ``` и другие тэги использовать запрещено. Заменяй символы <, >, &, если они не части тэга, на &lt;, &gt;, &amp;' },
        ...formattedMessages,
      ],
    });

    return (
      response.choices[0].message.content ??
      'Пришел пустой ответ от AI-модели, обратитесь к администратору'
    );
  } catch (error) {
    const err = error as Error;
    throw err;
  }
};
