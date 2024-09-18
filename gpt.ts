import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const answerWithChatGPT = async (message: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant ',
      },
      {
        role: 'user',
        content: message,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
};
