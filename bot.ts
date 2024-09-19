import { config } from 'dotenv';
import mongoose from 'mongoose';
import { Bot, GrammyError, HttpError } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { hydrate } from '@grammyjs/hydrate';
import { session } from 'grammy';
import { MyContext } from './types';
import User from './db/User';
import Chat from './db/Chat';
import Message from './db/Message';
import { answerWithChatGPT } from './utis/gpt';
import { MAX_HISTORY_LENGTH } from './utis/contst';
import logger from './logger';
import { getAnalytics } from './commands/analytics';

if (!process.env.BOT_API_KEY) {
  throw new Error('BOT_API_KEY is not defined');
}
const bot = new Bot<MyContext>(process.env.BOT_API_KEY);

bot.use(session({ initial: () => ({}) }));
bot.use(hydrate());

bot.api.setMyCommands([
  {
    command: 'start',
    description: 'Начать диалог',
  },
  {
    command: 'newchat',
    description: 'Начать новый чат',
  },
]);

bot.command('start', async (ctx) => {
  const { id, first_name, username } = ctx.from as TelegramUser;

  await ctx.reply('Добро пожаловать!');

  try {
    let user = await User.findOne({ telegramId: id });
    if (!user) {
      const responseMsg = await ctx.reply('Создаю Ваш персональный чат-бот, одну секунду...');
      user = await User.create({
        telegramId: id,
        firstName: first_name,
        userName: username,
      });
      await responseMsg.editText('Ваш персональный чат-бот создан. Пожалуйста, введите ваш вопрос');
    } else {
      await ctx.reply('Пожалуйста, введите ваш вопрос');
    }

    const chat = await Chat.create({
      userId: user._id,
    });

    ctx.session.chatId = chat._id.toString();
  } catch (error) {
    await ctx.reply('Произошла ошибка при создании персонального чат-бота. Пожалуйста, попробуйте позже.');
    logger.error('Error in /start command:', error);
  }
});

bot.command('newchat', async (ctx) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    const chat = await Chat.create({
      userId: user._id,
    });

    ctx.session.chatId = chat._id.toString();

    await ctx.reply('Новый чат создан. Пожалуйста, введите ваш вопрос.');
  } catch (error) {
    await ctx.reply('Произошла ошибка при создании нового чата. Пожалуйста, попробуйте позже.');
    logger.error('Error in /newchat command:', error);
  }
});

bot.command('stats', getAnalytics);

bot.on('message', async (ctx) => {
  const chatId = ctx.session.chatId;
  const messageText = ctx.message.text;

  if (!chatId) {
    await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start.');
    return;
  }

  if (!messageText) {
    await ctx.reply('Пожалуйста, введите ваш вопрос');
    return;
  }

  const responseMessage = await ctx.reply('Загрузка...');

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      await ctx.reply('Чат не найден. Пожалуйста, начните новый чат с помощью команды /start.');
      return;
    }

    await Message.create({
      chatId: chat._id,
      role: 'user',
      content: messageText,
    });

    const messages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .lean();

    const history = messages.slice(-MAX_HISTORY_LENGTH);

    const answer = await answerWithChatGPT(history);

    await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: answer,
    });

    chat.updatedAt = new Date();
    await chat.save();

    await responseMessage.editText(answer);
  } catch (error) {
    await responseMessage.editText(
      'Произошла ошибка при обработке запроса. Пожалуйста, обратитесь к администратору.',
    );
    logger.error('Error in message handler:', error);
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
