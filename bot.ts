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
  AiModels,
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
  START_MESSAGE,
} from './src/utils/consts';
import { getAnalytics, changeModel, topup } from './src/commands';
import { imageConversation } from './src/conversations/imageConversation';
import { logError } from './src/utils/alert';
import { startTopupKeyboard } from './src/commands/topup';
import { PACKAGES } from './src/bot-packages';

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
    command: 'balance',
    description: 'Узнать текущий баланс запросов',
  },
  {
    command: 'topup',
    description: 'Пополнить баланс',
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
  {
    command: 'help',
    description: 'Общая информация',
  },
]);

bot.on('pre_checkout_query', async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});
bot.on(':successful_payment', async (ctx) => {
  // const { id } = ctx.from as TelegramUser;
  console.log('ctx.from', ctx.from);

  console.log(
    'ctx.message?.successful_payment',
    ctx.message?.successful_payment,
  );

  // try {
  //   const user = await User.findOne({ telegramId: id });
  //   if (!user) {
  //     await ctx.reply('Пожалуйста, начните с команды /start.');
  //     return;
  //   }

  //   switch (amountInt) {
  //     case 100:
  //       user.basicRequestsBalance += 100;
  //       break;
  //     case 500:
  //       user.basicRequestsBalance += 500;
  //       break;
  //     case 1000:
  //       user.basicRequestsBalance += 950;
  //       user.proRequestsBalance += 50;
  //       break;
  //     default:
  //       break;
  //   }

  //   await user.save();

  //   await ctx.callbackQuery.message?.editText(
  //     `Баланс пополнен на ${amountInt} запросов ✅`,
  //   );
  //   await ctx.reply(getBalanceMessage(user), {
  //     parse_mode: 'MarkdownV2',
  //   });
  // } catch (error) {
  //   await ctx.reply(
  //     'Произошла ошибка при пополнении баланса. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
  //   );
  //   logError('Error in topup callbackQuery:', error);
  // }
});

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
    logError('Error in callbackQuery handler:', error);
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
bot.callbackQuery(Object.keys(PACKAGES), async (ctx) => {
  await ctx.answerCallbackQuery();
  const packageKey = ctx.callbackQuery.data as keyof typeof PACKAGES;

  try {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      throw new Error(`${ctx.callbackQuery.data} | Chat ID is not defined`);
    }
    if (!PACKAGES[packageKey]) {
      throw new Error(
        `${ctx.callbackQuery.data} | ${packageKey} is not in PACKAGES`,
      );
    }
    const { title, price, description } = PACKAGES[packageKey];

    await bot.api.sendInvoice(
      chatId,
      title,
      description,
      packageKey,
      'RUB',
      [
        {
          label: 'Руб',
          amount: price * 100,
        },
      ],
      {
        provider_token: process.env.YOOKASSA_PAYMENT_PROVIDER_TOKEN,
      },
    );
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при пополнении баланса. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in topup callbackQuery:', error);
  }
});
bot.callbackQuery('topup', topup);

// User commands
bot.command('start', async (ctx) => {
  const { id, first_name, username } = ctx.from as TelegramUser;

  await ctx.reply(START_MESSAGE, {
    parse_mode: 'MarkdownV2',
  });

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
        'Ваш персональный чат-бот создан. Пожалуйста, введите запрос',
      );
    } else {
      await ctx.reply('Напишите мне запрос, и я помогу Вам с ним!');
    }

    const chat = await Chat.create({
      userId: user._id,
    });

    ctx.session.chatId = chat._id.toString();
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при создании персонального чат-бота. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in /start command:', error);
  }
});
bot.command('help', async (ctx) => {
  await ctx.reply(HELP_MESSAGE, {
    parse_mode: 'MarkdownV2',
  });
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

    await ctx.reply('Новый чат создан. Пожалуйста, введите запрос.');
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при создании нового чата. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in /newchat command:', error);
  }
});
bot.command('image', async (ctx) => {
  if (!process.env.IMAGE_QUALITY_CHANGE_AVAILABLE) {
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
bot.command('models', changeModel);
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
      reply_markup: startTopupKeyboard,
    });
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при получении балансов. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in /balance command:', error);
  }
});
bot.command('topup', topup);

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

    if (AiModels[user.selectedModel] === AiModels.GPT_4O) {
      if (user.proRequestsBalance === 0) {
        await responseMessage.editText(
          getNoBalanceMessage(user.selectedModel),
          {
            reply_markup: startTopupKeyboard,
          },
        );
        return;
      }
      user.proRequestsBalance -= 1;
    } else {
      if (user.basicRequestsBalance === 0) {
        await responseMessage.editText(
          getNoBalanceMessage(user.selectedModel),
          {
            reply_markup: startTopupKeyboard,
          },
        );
        return;
      }
      user.basicRequestsBalance -= 1;
    }
    await user.save();

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

    chat.updatedAt = new Date();
    await chat.save();

    await responseMessage.editText(answer);
  } catch (error) {
    await responseMessage.editText(
      'Произошла ошибка при обработке запроса. Пожалуйста, обратитесь к администратору.',
    );
    logError('Error in message handler:', error);
  }
});

// Updated catch handler
bot.catch(async (err) => {
  const ctx = err.ctx;
  logError(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    logError('Error in request:', e);
  } else if (e instanceof HttpError) {
    logError('Could not contact Telegram:', e);
  } else {
    logError('Unknown error:', e);
  }

  try {
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  } catch (replyError) {
    logError('Failed to send error message to user:', replyError);
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
    logError('Error in startBot:', err);
  }
}

void startBot();

export default bot;
