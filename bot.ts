import 'dotenv/config';
import { Bot, Context, GrammyError, HttpError, InputFile } from 'grammy';
import { HydrateFlavor, hydrate } from '@grammyjs/hydrate';
import { answerWithChatGPT } from './gpt';
import { loadUserHistory, MAX_HISTORY_LENGTH, saveUserHistory } from './fs';

type MyContext = HydrateFlavor<Context>;

if (!process.env.BOT_API_KEY) {
  throw new Error('BOT_API_KEY is not defined');
}
const bot = new Bot<MyContext>(process.env.BOT_API_KEY);

bot.use(hydrate());

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

  const responseMessage = await ctx.reply('Загрузка...');

  let userHistory = loadUserHistory(ctx.chat.id);

  userHistory.push({ role: 'user', content: message });

  if (userHistory.length > MAX_HISTORY_LENGTH) {
    userHistory.shift();
  }

  saveUserHistory(ctx.chat.id, userHistory);

  try {
    const answer = await answerWithChatGPT(userHistory);

    userHistory.push({ role: 'assistant', content: answer });

    if (userHistory.length > MAX_HISTORY_LENGTH) {
      userHistory.shift();
    }

    saveUserHistory(ctx.chat.id, userHistory);

    await responseMessage.editText(answer);
  } catch (error) {
    await responseMessage.editText('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
  }
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
