import OpenAI from 'openai';
import 'dotenv/config';
import logger from './logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const answerWithChatGPT = async (messages: Array<{ role: string, content: string }>): Promise<string> => {
  const formattedMessages = messages.map((msg) => ({
    role: msg.role as 'system' | 'user' | 'assistant',
    content: msg.content,
  }));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Ты полезный ассистент, отвчай кратко и по делу' },
        ...formattedMessages,
      ],
    });

    return response.choices[0].message.content ?? 'Пришел пустой ответ от GPT-4, обратитесь к администратору';
  } catch (error) {
    const err = error as Error;
    logger.error(`Error in answerWithChatGPT: ${err.message}`);
    throw err;
  }
};
