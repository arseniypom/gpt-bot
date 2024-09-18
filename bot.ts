import 'dotenv/config';
import { Bot, Context, GrammyError, HttpError, InputFile } from 'grammy';
import { answerWithChatGPT } from './gpt';

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

bot.command('start', async (ctx) => await ctx.reply('Пожалуйста, введите ваш вопрос'));
bot.on('message', async (ctx) => {
  const message = ctx.message.text;
  if (!message) {
    await ctx.reply('Пожалуйста, введите ваш вопрос');
    return;
  }
  const answer = await answerWithChatGPT(message);
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
