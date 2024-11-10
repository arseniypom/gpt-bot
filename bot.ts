import 'dotenv/config';
import './src/cron/subscriptionRenew';
import './src/cron/refreshRequests';
import mongoose from 'mongoose';
import { Bot, GrammyError, HttpError, session } from 'grammy';
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
  SubscriptionLevel,
  SubscriptionLevels,
} from './src/types/types';
import {
  isValidAiModel,
  isValidImageGenerationQuality,
  isValidSubscriptionLevel,
} from './src/types/typeguards';
import User from './db/User';
import Chat from './db/Chat';
import Message from './db/Message';
import { answerWithChatGPT } from './src/utils/gpt';
import {
  BASIC_REQUEST_COST,
  COMMANDS,
  getNoBalanceMessage,
  MAX_BOT_MESSAGE_LENGTH,
  MAX_HISTORY_LENGTH,
  MAX_USER_MESSAGE_LENGTH,
  PRO_REQUEST_COST,
  SUPPORT_MESSAGE_POSTFIX,
  UNSUBSCRIBE_REASONS,
} from './src/utils/consts';
import {
  start,
  getStats,
  initiateAiModelChange,
  topupImg,
  topupText,
  createNewChat,
  checkChannelJoinAndRegisterUser,
  subscription,
  generateImage,
  myProfile,
  balance,
  support,
  help,
  subscriptionManage,
  changeSubscriptionLevel,
  unsubscribeInitiate,
  getUnsubscribeReason,
  unsubscribeFinalStep,
  initiateChangeSubscriptionLevel,
} from './src/commands';
import { getTopupAndChangeModelKeyboard } from './src/commands/topup';
import { getModelsKeyboard } from './src/commands/changeAiModel';
import { imageConversation } from './src/conversations/imageConversation';
import { supportConversation } from './src/conversations/supportConversation';
import { createPaymentConversation } from './src/conversations/createPaymentConversation';
import { buySubscriptionConversation } from './src/conversations/buySubscriptionConversation';
import { PACKAGES } from './src/bot-packages';
import { SUBSCRIPTIONS } from './src/bot-subscriptions';
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
bot.use(createConversation(buySubscriptionConversation));

void bot.api.setMyCommands(COMMANDS);

bot.on(':successful_payment', telegramSuccessfulPaymentHandler);

// Callback queries
bot.callbackQuery(
  'checkChannelJoinAndRegisterUser',
  checkChannelJoinAndRegisterUser,
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
      `Вы переключились на модель\n${AiModelsLabels[selectedModel]}${messagePostfix}`,
      {
        reply_markup: getModelsKeyboard(AiModelsLabels[selectedModel]),
      },
    );
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при сохранении модели. ${SUPPORT_MESSAGE_POSTFIX}`,
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
bot.callbackQuery('cancelSubscription', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('buySubscriptionConversation');
  await ctx.callbackQuery.message?.editText('Оплата отменена');
});
bot.callbackQuery('cancelUnsubscribe', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.callbackQuery.message?.editText('Действие отменено');
});
bot.callbackQuery(Object.values(ImageGenerationQuality), async (ctx) => {
  await ctx.answerCallbackQuery();
  const quality = ctx.callbackQuery.data;
  if (!isValidImageGenerationQuality(quality)) {
    await ctx.callbackQuery.message?.editText(
      `Что-то пошло не так. ${SUPPORT_MESSAGE_POSTFIX}`,
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
bot.callbackQuery(
  [
    SubscriptionLevels.START,
    SubscriptionLevels.OPTIMUM,
    SubscriptionLevels.PREMIUM,
    SubscriptionLevels.ULTRA,
  ],
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.callbackQuery.message?.editReplyMarkup(undefined);
    ctx.session.subscriptionLevel = ctx.callbackQuery.data as Exclude<
      SubscriptionLevel,
      'FREE'
    >;
    await ctx.conversation.enter('buySubscriptionConversation');
  },
);
bot.callbackQuery('topupText', topupText);
bot.callbackQuery('topup', topupImg);
bot.callbackQuery('subscription', subscription);
bot.callbackQuery('initiateAiModelChange', initiateAiModelChange);
bot.callbackQuery(
  ['subscriptionManage', 'backToSubscriptionManage'],
  subscriptionManage,
);
bot.callbackQuery('changeSubscriptionLevel', changeSubscriptionLevel);
bot.callbackQuery('unsubscribe', unsubscribeInitiate);
bot.callbackQuery('verifySubscriptionCancel', getUnsubscribeReason);
bot.callbackQuery(Object.keys(UNSUBSCRIBE_REASONS), unsubscribeFinalStep);
bot.callbackQuery(
  'initiateChangeSubscriptionLevel',
  initiateChangeSubscriptionLevel,
);
bot.callbackQuery(
  Object.keys(SUBSCRIPTIONS).map((key) => `${key}-CHANGE`),
  changeSubscriptionLevel,
);
bot.callbackQuery('backToMyProfile', myProfile);

// User commands
bot.command('start', start);
bot.command('help', help);
bot.command('newchat', createNewChat);
bot.command('image', generateImage);
bot.command('models', initiateAiModelChange);
bot.command('balance', balance);
bot.command('topup', topupImg);
bot.command('subscription', subscription);
bot.command('profile', myProfile);
bot.command('support', support);
bot.command('del', async (ctx) => {
  const telegramId = ctx.from?.id;
  try {
    const user = await User.findOneAndDelete({ telegramId });
    if (!user) {
      await ctx.reply('⛔︎ Not found');
      return;
    }
    await ctx.reply('⌦ Dropped');
  } catch (error) {
    logError({
      message: 'Error deleting user',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
    await ctx.reply('Произошла ошибка при удалении пользователя');
  }
});

// Admin commands
bot.command('stats', getStats);

// Keyboard handlers
bot.hears('🎉 Подключить подписку', subscription);
bot.hears('💰 Купить доп. запросы', topupImg);
bot.hears('🪪 Мой профиль', myProfile);
bot.hears('💬 Начать новый чат', createNewChat);
bot.hears('🖼️ Сгенерировать изображение', generateImage);
bot.hears('🤖 Выбрать AI-модель', initiateAiModelChange);
bot.hears('ℹ️ Информация', help);
bot.hears('🆘 Поддержка', support);

// Message handler
bot.on('message:text', async (ctx) => {
  let chatId = ctx.session.chatId;
  let chatObj;
  const telegramId = ctx.from.id;
  const userMessageText = ctx.message.text;

  if (userMessageText.length > MAX_USER_MESSAGE_LENGTH) {
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
        'Пожалуйста, начните новый чат с помощью команды /start',
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
          'Пожалуйста, начните новый чат с помощью команды /start',
        );
        return;
      }
    }

    const chat = chatObj || (await Chat.findById(chatId));
    if (!chat) {
      await ctx.reply(
        'Чат не найден. Пожалуйста, начните новый чат с помощью команды /start',
      );
      return;
    }

    if (AiModels[user.selectedModel] === AiModels.GPT_4O) {
      if (
        user.proRequestsLeftThisMonths === 0 &&
        user.coinsBalance - PRO_REQUEST_COST < 0
      ) {
        await responseMessage.editText(
          getNoBalanceMessage(user.selectedModel),
          {
            reply_markup: getTopupAndChangeModelKeyboard(
              user.subscriptionLevel,
            ),
          },
        );
        return;
      }
    } else if (AiModels[user.selectedModel] === AiModels.GPT_4O_MINI) {
      if (
        user.basicRequestsLeftThisWeek === 0 &&
        user.basicRequestsLeftToday === 0 &&
        user.coinsBalance - BASIC_REQUEST_COST < 0
      ) {
        await responseMessage.editText(
          getNoBalanceMessage(user.selectedModel),
          {
            reply_markup: getTopupAndChangeModelKeyboard(
              user.subscriptionLevel,
            ),
          },
        );
        return;
      }
    } else {
      throw new Error('Invalid model: ' + user.selectedModel);
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
        `Произошла ошибка при генерации ответа. ${SUPPORT_MESSAGE_POSTFIX}`,
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
      if (user.proRequestsLeftThisMonths > 0) {
        user.proRequestsLeftThisMonths -= 1;
      } else {
        user.coinsBalance -= PRO_REQUEST_COST;
      }
    } else {
      if (user.basicRequestsLeftThisWeek > 0) {
        user.basicRequestsLeftThisWeek -= 1;
      } else if (user.basicRequestsLeftToday > 0) {
        user.basicRequestsLeftToday -= 1;
      } else {
        user.coinsBalance -= BASIC_REQUEST_COST;
      }
    }
    user.updatedAt = new Date();
    await user.save();

    if (answer.length > MAX_BOT_MESSAGE_LENGTH) {
      const chunks = answer.match(new RegExp(`[^]{1,${MAX_BOT_MESSAGE_LENGTH}}`, 'g')) || [];
      await responseMessage.editText(chunks[0]!);
      for (let i = 1; i < chunks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await ctx.reply(chunks[i]);
      }
    } else {
      await responseMessage.editText(answer);
    }
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
