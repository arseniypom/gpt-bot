import 'dotenv/config';
import mongoose from 'mongoose';
import { Bot, GrammyError, HttpError, InlineKeyboard, session } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { hydrate } from '@grammyjs/hydrate';
import { conversations, createConversation } from '@grammyjs/conversations';
import { limit } from '@grammyjs/ratelimiter';
import {
  MyContext,
  AiModelsLabels,
  ImageGenerationQuality,
  SessionData,
  AiModels,
  PackageName,
} from './src/types/types';
import {
  isValidAiModel,
  isValidImageGenerationQuality,
} from './src/types/typeguards';
import User from './db/User';
import Chat from './db/Chat';
import Message from './db/Message';
import { answerWithChatGPT } from './src/utils/gpt';
import {
  getBalanceMessage,
  getNoBalanceMessage,
  HELP_MESSAGE,
  MAX_HISTORY_LENGTH,
} from './src/utils/consts';
import {
  start,
  getStats,
  initiateAiModelChange,
  topupImg,
  topupText,
  createNewChat,
  checkSubscriptionAndRegisterUser,
} from './src/commands';
import {
  topupAndChangeModelKeyboard,
  initiateTopupKeyboard,
} from './src/commands/topup';
import { getModelsKeyboard } from './src/commands/changeAiModel';
import { imageConversation } from './src/conversations/imageConversation';
import { supportConversation } from './src/conversations/supportConversation';
import { createPaymentConversation } from './src/conversations/createPaymentConversation';
import { PACKAGES } from './src/bot-packages';
import { checkUserInDB, ignoreOld } from './src/utils/middleware';
import {
  logError,
  getBotApiKey,
  getMongoDbUri,
} from './src/utils/utilFunctions';
import { telegramSuccessfulPaymentHandler } from './src/utils/payments';

const BOT_API_KEY = getBotApiKey();

if (!BOT_API_KEY) {
  throw new Error('BOT_API_KEY is not defined');
}

const bot = new Bot<MyContext>(BOT_API_KEY);

bot.on('pre_checkout_query', async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.use(
  session({
    initial: (): SessionData => ({
      imageQuality: ImageGenerationQuality.STANDARD,
    }),
  }),
);
bot.use(hydrate());
bot.use(conversations());

bot.use(ignoreOld);

bot.use(
  limit({
    timeFrame: 2000,
    limit: 3,
    onLimitExceeded: async (ctx) => {
      await ctx.reply(
        'Пожалуйста, не отправляйте запросы слишком часто. Подождите 5 секунд и попробуйте снова.',
      );
    },
  }),
);

bot.use(checkUserInDB);

// Conversations
bot.use(createConversation(imageConversation));
bot.use(createConversation(supportConversation));
bot.use(createConversation(createPaymentConversation));

void bot.api.setMyCommands([
  {
    command: 'balance',
    description: '🏦 Текущий баланс запросов',
  },
  {
    command: 'topup',
    description: '💰 Пополнить баланс',
  },
  {
    command: 'newchat',
    description: '💬 Начать новый чат',
  },
  {
    command: 'image',
    description: '🖼️ Сгенерировать изображение',
  },
  {
    command: 'models',
    description: '🤖 Выбрать AI-модель',
  },
  {
    command: 'help',
    description: 'ℹ️ Общая информация',
  },
  {
    command: 'support',
    description: '🆘 Обратиться в поддержку',
  },
]);

bot.on(':successful_payment', telegramSuccessfulPaymentHandler);

// Callback queries
bot.callbackQuery(
  'checkSubscriptionAndRegisterUser',
  checkSubscriptionAndRegisterUser,
);
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
    user.updatedAt = new Date();
    await user.save();

    const messagePostfix =
      AiModels[selectedModel] === AiModels.GPT_4O ? '' : ' (базовые запросы) ';

    await ctx.callbackQuery.message?.editText(
      `Вы переключились на модель\n${AiModelsLabels[selectedModel]}${messagePostfix} ✅`,
      {
        reply_markup: getModelsKeyboard(AiModelsLabels[selectedModel]),
      },
    );
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при сохранении модели. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError({
      message: 'Error in callbackQuery handler',
      error,
      telegramId: id,
      username: ctx.from.username,
    });
  }
});
bot.callbackQuery('cancelImageGeneration', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('imageConversation');
  await ctx.callbackQuery.message?.editText('Генерация изображения отменена');
});
bot.callbackQuery('cancelSupport', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('supportConversation');
  await ctx.callbackQuery.message?.editText('Запрос в поддержку отменен');
});
bot.callbackQuery('cancelPayment', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('createPaymentConversation');
  await ctx.callbackQuery.message?.editText('Оплата отменена');
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
// Here you can enter createPaymentConversation or pass createInvoice function
bot.callbackQuery(Object.keys(PACKAGES), async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.callbackQuery.message?.editReplyMarkup(undefined);
  ctx.session.packageName = ctx.callbackQuery.data as PackageName;
  await ctx.conversation.enter('createPaymentConversation');
});
bot.callbackQuery('topupText', topupText);
bot.callbackQuery('topup', topupImg);
bot.callbackQuery('initiateAiModelChange', initiateAiModelChange);

// User commands
bot.command('start', start);
bot.command('help', async (ctx) => {
  await ctx.reply(HELP_MESSAGE, {
    parse_mode: 'MarkdownV2',
  });
});
bot.command('newchat', createNewChat);
bot.command('image', async (ctx) => {
  if (process.env.IMAGE_QUALITY_CHANGE_AVAILABLE === 'false') {
    await ctx.conversation.enter('imageConversation');
    return;
  }
  const qualityKeyboard = new InlineKeyboard()
    .text('Standard', ImageGenerationQuality.STANDARD)
    .text('HD', ImageGenerationQuality.HD)
    .row()
    .text('Отменить ❌', 'cancelImageGeneration');

  await ctx.reply(
    `Выберите качество изображения:
    standard — стандартное
    hd — повышенная детализация`,
    {
      reply_markup: qualityKeyboard,
    },
  );
});
bot.command('models', initiateAiModelChange);
bot.command('balance', async (ctx) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    await ctx.reply(getBalanceMessage(user), {
      parse_mode: 'MarkdownV2',
      reply_markup: initiateTopupKeyboard,
    });
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при получении балансов. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError({
      message: 'Error in /balance command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
});
bot.command('topup', topupImg);
bot.command('support', async (ctx) => {
  await ctx.conversation.enter('supportConversation');
});

// Admin commands
bot.command('stats', getStats);

// Message handler
bot.on('message:text', async (ctx) => {
  let chatId = ctx.session.chatId;
  let chatObj;
  const telegramId = ctx.from.id;
  const userMessageText = ctx.message.text;

  if (userMessageText.length > 3000) {
    await ctx.reply(
      'Превышен лимит символов. Пожалуйста, сократите Ваше сообщение.',
    );
    return;
  }

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

    if (AiModels[user.selectedModel] === AiModels.GPT_4O) {
      if (user.proRequestsBalance === 0) {
        await responseMessage.editText(
          getNoBalanceMessage(user.selectedModel),
          {
            reply_markup: topupAndChangeModelKeyboard,
          },
        );
        return;
      }
    } else {
      if (user.basicRequestsBalance === 0) {
        await responseMessage.editText(
          getNoBalanceMessage(user.selectedModel),
          {
            reply_markup: topupAndChangeModelKeyboard,
          },
        );
        return;
      }
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
    const answer = await answerWithChatGPT(
      history,
      telegramId,
      selectedModelName,
    );

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

    await chat.save();

    if (AiModels[user.selectedModel] === AiModels.GPT_4O) {
      user.proRequestsBalance -= 1;
    } else {
      user.basicRequestsBalance -= 1;
    }
    user.updatedAt = new Date();
    await user.save();

    await responseMessage.editText(answer);
  } catch (error) {
    await responseMessage.editText(
      'Произошла ошибка при обработке запроса. Пожалуйста, обратитесь к администратору.',
    );
    logError({
      message: 'Error in message handler',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
});

// Updated catch handler
bot.catch(async (err) => {
  const ctx = err.ctx;
  logError({
    message: `Error while handling update ${ctx.update.update_id}`,
    error: err.error,
    telegramId: ctx.from?.id,
    username: ctx.from?.username,
  });
  const e = err.error;
  let message;

  if (e instanceof GrammyError) {
    message = 'Error in request';
  } else if (e instanceof HttpError) {
    message = 'Could not contact Telegram';
  } else {
    message = 'Unknown error';
  }
  logError({
    message,
    error: e,
    telegramId: ctx.from?.id,
    username: ctx.from?.username,
  });

  try {
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  } catch (replyError) {
    logError({
      message: 'Failed to send error message to user in bot.catch',
      error: replyError,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
});

async function startBot() {
  try {
    const mongoDbUri = getMongoDbUri();
    if (!mongoDbUri) {
      throw new Error('MONGO_DB_URI is not defined');
    }
    const mongooseResponse = await mongoose.connect(mongoDbUri);
    if (!mongooseResponse.connection.readyState) {
      throw new Error('Mongoose connection error');
    }
    void bot.start();
    // eslint-disable-next-line no-console
    console.log('Mongoose connected & bot started');
  } catch (error) {
    const err = error as Error;
    logError({
      message: 'Error in startBot',
      error: err,
    });
  }
}

void startBot();

export default bot;
