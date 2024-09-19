import { config } from 'dotenv';
import mongoose from 'mongoose';
import { Bot, Context, GrammyError, HttpError } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { HydrateFlavor, hydrate } from '@grammyjs/hydrate';
import { answerWithChatGPT } from './utis/gpt';
import User from './db/User';
import Message from './db/Message';
import { MAX_HISTORY_LENGTH } from './utis/contst';
import logger from './logger';

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
  const { id, first_name, username } = ctx.from as TelegramUser;

  await ctx.reply('Добро пожаловать!');

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      const responseMsg = await ctx.reply('Создаю Ваш персональный чат-бот, одну секунду...');
      await User.create({
        telegramId: id,
        firstName: first_name,
        userName: username,
        history: [],
      });
      await responseMsg.editText('Ваш персональный чат-бот создан. Пожалуйста, введите ваш вопрос');
      return;
    }
    await ctx.reply('Пожалуйста, введите ваш вопрос');
  } catch (error) {
    await ctx.reply('Произошла ошибка при создании персонального чат-бота. Пожалуйста, попробуйте позже.');
    logger.error('Error in /start command:', error);
  }
});

bot.on('message', async (ctx) => {
  const message = ctx.message.text;
  if (!message) {
    await ctx.reply('Пожалуйста, введите ваш вопрос');
    return;
  }

  const responseMessage = await ctx.reply('Загрузка...');

  const user = await User.findOne({ telegramId: ctx.from.id }).populate('history');
  if (!user) {
    await ctx.reply('Пользователь не найден. Пожалуйста, начните с команды /start.');
    return;
  }

  const userHistory: any = user.history;

  const newMessage: any = await Message.create({
    userId: user._id,
    role: 'user',
    content: message,
  });

  userHistory.push(newMessage);

  if (userHistory.length > MAX_HISTORY_LENGTH) {
    const oldestMessage: any = userHistory.shift();
    await Message.findByIdAndDelete(oldestMessage._id);
  }

  await user.save();

  try {
    const answer = await answerWithChatGPT(userHistory);

    const newAnswer = await Message.create({
      userId: user._id,
      role: 'assistant',
      content: answer,
    });

    userHistory.push(newAnswer);

    if (userHistory.length > MAX_HISTORY_LENGTH) {
      const oldestMessage = userHistory.shift();
      await Message.findByIdAndDelete(oldestMessage._id);
    }

    await user.save();

    await responseMessage.editText(answer);
  } catch (error) {
    await responseMessage.editText('Произошла ошибка при обработке вашего запроса. Пожалуйста, обратитесь к администратору.');
  }
});

bot.catch((err) => {
  const ctx = err.ctx;
  logger.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    logger.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    logger.error('Could not contact Telegram:', e);
  } else {
    logger.error('Unknown error:', e);
  }
});

async function startBot() {
  try {
    if (!process.env.MONGO_DB_URI) {
      throw new Error('MONGO_DB_URI is not defined');
    }
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log('Connected to MongoDB');
    bot.start();
    console.log('Bot started');
  } catch (error) {
    const err = error as Error;
    logger.error('Error connecting to MongoDB or starting bot:', err);
  }
}

startBot();
