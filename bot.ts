import 'dotenv/config';
import { Bot, Context, GrammyError, HttpError, InputFile } from 'grammy';
import { answerWithChatGPT } from './gpt';
import { loadUserHistory, MAX_HISTORY_LENGTH, saveUserHistory } from './fs';

if (!process.env.BOT_API_KEY) {
  throw new Error('BOT_API_KEY is not defined');
}
const bot = new Bot(process.env.BOT_API_KEY);

bot.api.setMyCommands([
  {
    command: 'start',
    description: 'Начать диалог',
  },
]);

bot.command('start', async (ctx) => {
  saveUserHistory(ctx.chat.id, []);
  await ctx.reply('Пожалуйста, введите ваш вопрос');
});

bot.on('message', async (ctx) => {
  const message = ctx.message.text;
  if (!message) {
    await ctx.reply('Пожалуйста, введите ваш вопрос');
    return;
  }

  let userHistory = loadUserHistory(ctx.chat.id);

  userHistory.push({ role: 'user', content: message });

  if (userHistory.length > MAX_HISTORY_LENGTH) {
    userHistory.shift();
  }

  saveUserHistory(ctx.chat.id, userHistory);

  const answer = await answerWithChatGPT(userHistory);

  // Добавляем ответ бота в историю
  userHistory.push({ role: 'assistant', content: answer });

  // Снова проверяем лимит сообщений
  if (userHistory.length > MAX_HISTORY_LENGTH) {
    userHistory.shift();
  }

  // Сохраняем историю с ответом бота
  saveUserHistory(ctx.chat.id, userHistory);

  await ctx.reply(answer);
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

bot.start();
