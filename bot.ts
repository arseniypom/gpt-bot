import 'dotenv/config';
import mongoose from 'mongoose';
import { Bot, GrammyError, HttpError, InlineKeyboard, session } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { hydrate } from '@grammyjs/hydrate';
import { conversations, createConversation } from '@grammyjs/conversations';
import {
  MyContext,
  AiModelsLabels,
  ImageGenerationQuality,
  SessionData,
} from './src/types/types';
import {
  isValidAiModel,
  isValidImageGenerationQuality,
} from './src/types/typeguards';
import User from './db/User';
import Chat from './db/Chat';
import Message from './db/Message';
import { answerWithChatGPT } from './src/utils/gpt';
import { MAX_HISTORY_LENGTH } from './src/utils/consts';
import logger from './logger';
import { getAnalytics, changeModel } from './src/commands';
import { imageConversation } from './src/conversations/imageConversation';

if (!process.env.BOT_API_KEY) {
  throw new Error('BOT_API_KEY is not defined');
}
const bot = new Bot<MyContext>(process.env.BOT_API_KEY);

bot.use(
  session({
    initial: (): SessionData => ({
      imageQuality: ImageGenerationQuality.STANDARD,
    }),
  }),
);
bot.use(hydrate());
bot.use(conversations());

// Conversations
bot.use(createConversation(imageConversation));

void bot.api.setMyCommands([
  {
    command: 'start',
    description: 'Начать диалог',
  },
  {
    command: 'newchat',
    description: 'Начать новый чат',
  },
  {
    command: 'image',
    description: 'Сгенерировать изображение',
  },
  {
    command: 'models',
    description: 'Выбрать AI-модель',
  },
]);

// Callback queries
bot.callbackQuery(Object.keys(AiModelsLabels), async (ctx) => {
  await ctx.answerCallbackQuery();
  const selectedModel = ctx.callbackQuery.data;
  const { id } = ctx.from;

  if (!isValidAiModel(selectedModel)) {
    await ctx.callbackQuery.message?.editText(
      'Неверная модель. Пожалуйста, выберите правильную модель.',
    );
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

    await ctx.callbackQuery.message?.editText(
      `Вы переключились на модель ${AiModelsLabels[selectedModel]}  ✅`,
    );
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при сохранении модели. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logger.error('Error in callbackQuery handler:', error);
  }
});
bot.callbackQuery('cancelImageGeneration', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('imageConversation');
  await ctx.callbackQuery.message?.editText('Генерация изображения отменена');
});
bot.callbackQuery(Object.values(ImageGenerationQuality), async (ctx) => {
  await ctx.answerCallbackQuery();
  const quality = ctx.callbackQuery.data;
  if (!isValidImageGenerationQuality(quality)) {
    await ctx.callbackQuery.message?.editText(
      'Что-то пошло не так. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    return;
  }
  ctx.session.imageQuality = quality;
  await ctx.callbackQuery.message?.editText(`Выбрано качество: ${quality}`);

  await ctx.conversation.enter('imageConversation');
});

// User commands
bot.command('start', async (ctx) => {
  const { id, first_name, username } = ctx.from as TelegramUser;

  await ctx.reply(
    `
Привет\! 👋  
Я \- твой универсальный ИИ\-ассистент 🤖  
Помогу:  
\- решить задачи по любому предмету 📚  
\- написать статью, имеил, сообщение или поздравление с днем рождения ✍️🎉  
\- придумать историю или любой другой креатив 💡  
\- составить план или предложить несколько решений проблемы 📝  
\- расписать меню на неделю под любые специфические запросы 🍽️  
\- сгенерировать изображение 🖼️  
И многое другое\! 💼  

P\.S\. Я работаю на базе OpenAI API 🔗
`,
    {
      parse_mode: 'MarkdownV2',
    },
  );

  try {
    let user = await User.findOne({ telegramId: id });
    if (!user) {
      const responseMsg = await ctx.reply(
        'Создаю Ваш персональный чат-бот, одну секунду...',
      );
      user = await User.create({
        telegramId: id,
        firstName: first_name,
        userName: username,
      });
      await responseMsg.editText(
        'Ваш персональный чат-бот создан. Пожалуйста, введите ваш вопрос',
      );
    } else {
      await ctx.reply('Пожалуйста, введите ваш вопрос');
    }

    const chat = await Chat.create({
      userId: user._id,
    });

    ctx.session.chatId = chat._id.toString();
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при создании персонального чат-бота. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
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
    await ctx.reply(
      'Произошла ошибка при создании нового чата. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logger.error('Error in /newchat command:', error);
  }
});
bot.command('image', async (ctx) => {
  const qualityKeyboard = new InlineKeyboard()
    .text('Standard', ImageGenerationQuality.STANDARD)
    .text('HD', ImageGenerationQuality.HD)
    .row()
    .text('Отменить ❌', 'cancelImageGeneration');

  await ctx.reply(
    'Выберите качество изображения: standard – стандартное, hd – повышенная детализация',
    {
      reply_markup: qualityKeyboard,
    },
  );
});
bot.command('models', changeModel);

// Admin commands
bot.command('stats', getAnalytics);

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
      await responseMessage.editText(
        'Пользователь не найден. Пожалуйста, начните новый чат с помощью команды /start.',
      );
      return;
    }

    if (!chatId) {
      const latestChat = await Chat.findOne({ userId: user._id }).sort({
        createdAt: -1,
      });
      if (latestChat) {
        chatObj = latestChat;
        chatId = latestChat._id.toString();
        ctx.session.chatId = chatId;
      } else {
        await responseMessage.editText(
          'Пожалуйста, начните новый чат с помощью команды /start.',
        );
        return;
      }
    }

    const chat = chatObj || (await Chat.findById(chatId));
    if (!chat) {
      await ctx.reply(
        'Чат не найден. Пожалуйста, начните новый чат с помощью команды /start.',
      );
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

    if (!answer) {
      await responseMessage.editText(
        'Произошла ошибка при генерации ответа. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
      );
      return;
    }

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
    const mongooseResponse = await mongoose.connect(process.env.MONGO_DB_URI);
    if (!mongooseResponse.connection.readyState) {
      throw new Error('Mongoose connection error');
    }
    void bot.start();
    // eslint-disable-next-line no-console
    console.log('Mongoose connected & bot started');
  } catch (error) {
    const err = error as Error;
    logger.error('Error in startBot:', err);
  }
}

void startBot();
