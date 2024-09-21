import 'dotenv/config';
import mongoose from 'mongoose';
import { Bot, GrammyError, HttpError, session } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { hydrate } from '@grammyjs/hydrate';
import { MyContext, AiModelsLabels } from './types/types';
import { isValidAiModel } from './types/typeguards';
import User from './db/User';
import Chat from './db/Chat';
import Message from './db/Message';
import { answerWithChatGPT } from './utils/gpt';
import { MAX_HISTORY_LENGTH } from './utils/consts';
import logger from './logger';
import { getAnalytics, changeModel } from './commands';

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
  {
    command: 'models',
    description: 'Выбрать AI-модель',
  },
]);

// User commands
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
bot.command('models', changeModel);

// Admin commands
bot.command('stats', getAnalytics);

// Callback queries
bot.callbackQuery(Object.keys(AiModelsLabels), async (ctx) => {
  await ctx.answerCallbackQuery();
  const selectedModel = ctx.callbackQuery.data;
  const { id } = ctx.from;

  if (!isValidAiModel(selectedModel)) {
    await ctx.callbackQuery.message!.editText('Неверная модель. Пожалуйста, выберите правильную модель.');
    return;
  }

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    user.selectedModel = selectedModel;
    await user.save();

    await ctx.callbackQuery.message!.editText(`Вы переключились на модель ${AiModelsLabels[selectedModel]}  ✅`);
  } catch (error) {
    await ctx.reply('Произошла ошибка при сохранении модели. Пожалуйста, попробуйте позже.');
    logger.error('Error in callbackQuery handler:', error);
  }
});

// Message handler
bot.on('message:text', async (ctx) => {
  let chatId = ctx.session.chatId;
  let chatObj;
  const telegramId = ctx.from.id;
  const userMessageText = ctx.message.text;

  const responseMessage = await ctx.reply('Загрузка...');

  try {
    const user = await User.findOne({ telegramId });
    if (!user) {
      await responseMessage.editText('Пользователь не найден. Пожалуйста, начните новый чат с помощью команды /start.');
      return;
    }

    if (!chatId) {
      const latestChat = await Chat.findOne({ userId: user._id }).sort({ createdAt: -1 });
      if (latestChat) {
        chatObj = latestChat;
        chatId = latestChat._id.toString();
        ctx.session.chatId = chatId;
      } else {
        await responseMessage.editText('Пожалуйста, начните новый чат с помощью команды /start.');
        return;
      }
    }

    const chat = chatObj || await Chat.findById(chatId);
    if (!chat) {
      await ctx.reply('Чат не найден. Пожалуйста, начните новый чат с помощью команды /start.');
      return;
    }

    await Message.create({
      chatId: chat._id,
      userId: user._id,
      role: 'user',
      content: userMessageText,
    });

    const messages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .lean();

    const history = messages.slice(-MAX_HISTORY_LENGTH);
    const selectedModelName = user.selectedModel;
    const answer = await answerWithChatGPT(history, selectedModelName);

    await Message.create({
      chatId: chat._id,
      userId: user._id,
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
function isValidModel(selectedModel: string) {
  throw new Error('Function not implemented.');
}

