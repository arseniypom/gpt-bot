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
  UserStages,
  SubscriptionLevel,
  SubscriptionLevels,
  TokenPackageName,
} from './src/types/types';
import { isValidImageGenerationQuality } from './src/types/typeguards';
import User from './db/User';
import {
  BUTTON_LABELS,
  COMMANDS,
  START_MESSAGE_STEP_7,
  SUPPORT_MESSAGE_POSTFIX,
  UNSUBSCRIBE_REASONS,
} from './src/utils/consts';
import {
  startStep1,
  startStep2,
  startStep3,
  startStep4,
  startStep5,
  startStep5BuyTrial,
  startStep6,
  checkChannelJoinAndGoToStep6,
  startStep7,
  getStats,
  refreshStats,
  topup,
  createNewChat,
  subscription,
  generateImage,
  myProfile,
  referralProgram,
  balance,
  support,
  help,
  helpMessagesHandler,
  helpBackHandler,
  settings,
  settingsChangeModel,
  settingsChangeChatMode,
  subscriptionManage,
  changeSubscriptionLevel,
  unsubscribeInitiate,
  getUnsubscribeReason,
  unsubscribeFinalStep,
  initiateChangeSubscriptionLevel,
} from './src/commands';
import { imageConversation } from './src/conversations/imageConversation';
import { supportConversation } from './src/conversations/supportConversation';
import { buyTokensConversation } from './src/conversations/buyTokensConversation';
import { buySubscriptionConversation } from './src/conversations/buySubscriptionConversation';
import { promocodeConversation } from './src/conversations/promocodeConversation';
import { SUBSCRIPTIONS } from './src/bot-subscriptions';
import { checkUserInDB, ignoreOld } from './src/utils/middleware';
import {
  logError,
  getBotApiKey,
  getMongoDbUri,
  setUserBlocked,
} from './src/utils/utilFunctions';
import { TOKEN_PACKAGES } from './src/bot-token-packages';
import { answerWithGPT } from './src/gptHandlers/answerWithGPT';

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
bot.use(createConversation(buyTokensConversation));
bot.use(createConversation(buySubscriptionConversation));
bot.use(createConversation(promocodeConversation));

void bot.api.setMyCommands(COMMANDS);

// Callback queries
bot.callbackQuery('startStep2', startStep2);
bot.callbackQuery('startStep3', startStep3);
bot.callbackQuery('startStep4', startStep4);
bot.callbackQuery('startStep5', startStep5);
bot.callbackQuery('startStep6', startStep6);
bot.callbackQuery('checkChannelJoinAndGoToStep6', checkChannelJoinAndGoToStep6);
bot.callbackQuery(['startStep7', 'startSkip'], startStep7);
bot.callbackQuery(Object.keys(AiModelsLabels), settingsChangeModel);
bot.callbackQuery(['basic', 'dialogue'], settingsChangeChatMode);
bot.callbackQuery('newChat', createNewChat);
bot.callbackQuery('cancelImageGeneration', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('imageConversation');
  await ctx.callbackQuery.message?.editText('Генерация изображения отменена');
});
bot.callbackQuery('cancelSupport', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('supportConversation');
  await ctx.callbackQuery.message?.editText('Запрос в поддержку отменен ✅');
});
bot.callbackQuery('cancelPayment', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('buyTokensConversation');
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
bot.callbackQuery('cancelPromocode', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено ✅');
  await ctx.conversation.exit('promocodeConversation');
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
// Here you can enter buyTokensConversation or pass createInvoice function
bot.callbackQuery(Object.keys(TOKEN_PACKAGES), async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.callbackQuery.message?.delete();
  ctx.session.packageName = ctx.callbackQuery.data as TokenPackageName;
  await ctx.conversation.enter('buyTokensConversation');
});
bot.callbackQuery(
  [
    SubscriptionLevels.START,
    SubscriptionLevels.OPTIMUM,
    SubscriptionLevels.PREMIUM,
    SubscriptionLevels.ULTRA,
    SubscriptionLevels.OPTIMUM_TRIAL,
  ],
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.callbackQuery.message?.delete();
    ctx.session.subscriptionLevel = ctx.callbackQuery.data as Exclude<
      SubscriptionLevel,
      'FREE'
    >;
    await ctx.conversation.enter('buySubscriptionConversation');
  },
);
bot.callbackQuery('checkChannelJoinAndBuyTrial', async (ctx) => {
  await ctx.answerCallbackQuery();
  const { id } = ctx.from;
  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    if (user.userStage === UserStages.REGISTERED) {
      user.userStage = UserStages.SUBSCRIBED_TO_CHANNEL;
      await user.save();
    }
    if (user.subscriptionLevel !== SubscriptionLevels.FREE) {
      await ctx.reply(
        'Подписка уже оформлена. Чтобы посмотреть лимиты или изменить уровень подписки, воспользуйтесь командой /profile',
      );
      return;
    }
    if (user.canActivateTrial) {
      ctx.session.subscriptionLevel = SubscriptionLevels.OPTIMUM_TRIAL;
    } else {
      ctx.session.subscriptionLevel = SubscriptionLevels.OPTIMUM;
    }
    await ctx.conversation.enter('buySubscriptionConversation');
  } catch (error) {
    await ctx.reply(`Произошла ошибка. ${SUPPORT_MESSAGE_POSTFIX}`);
    logError({
      message: 'Error in checkChannelJoinAndBuyTrial callback query',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
});
bot.callbackQuery(
  `${SubscriptionLevels.OPTIMUM_TRIAL}-step5`,
  startStep5BuyTrial,
);
bot.callbackQuery('topup', topup);
bot.callbackQuery('backToTopup', async (ctx) => {
  await ctx.callbackQuery.message?.delete();
  await ctx.conversation.exit('buyTokensConversation');
  await topup(ctx);
});
bot.callbackQuery('subscription', subscription);
bot.callbackQuery('backToSubscriptions', async (ctx) => {
  await ctx.callbackQuery.message?.delete();
  await ctx.conversation.exit('buySubscriptionConversation');
  await subscription(ctx);
});
bot.callbackQuery('settings', settings);
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
bot.callbackQuery('checkChannelJoin', async (ctx) => {
  await ctx.answerCallbackQuery();
  const { id } = ctx.from;
  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    if (user.userStage === UserStages.REGISTERED) {
      user.userStage = UserStages.SUBSCRIBED_TO_CHANNEL;
      await user.save();
    }

    await ctx.callbackQuery.message?.editText(START_MESSAGE_STEP_7, {
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при проверке подписки. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in checkChannelJoin callback query',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
});
bot.callbackQuery('newChat', createNewChat);
bot.callbackQuery(
  [
    'helpFindMenu',
    'helpHowToUseBot',
    'helpRequests',
    'helpModels',
    'helpSubscription',
    'helpTokens',
    'helpChatModes',
  ],
  helpMessagesHandler,
);
bot.callbackQuery(['helpBack', 'helpBackFindMenu'], helpBackHandler);
bot.callbackQuery('referralProgram', referralProgram);
bot.callbackQuery('hide', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.callbackQuery.message?.delete();
});
bot.callbackQuery('void', async (ctx) => {
  await ctx.answerCallbackQuery();
});
bot.callbackQuery('refreshStats', refreshStats);

// User commands
bot.command('start', startStep1);
bot.command('help', help);
bot.command('newchat', createNewChat);
bot.command('image', generateImage);
bot.command('balance', balance);
bot.command('topup', topup);
bot.command('subscription', subscription);
bot.command('profile', myProfile);
bot.command('support', support);
bot.command('settings', settings);
bot.command('promocode', async (ctx) => {
  await ctx.conversation.enter('promocodeConversation');
});

// Admin commands
bot.command('stats', getStats);
bot.command('del', async (ctx) => {
  if (
    ctx.from?.id !== Number(process.env.ADMIN_TELEGRAM_ID) &&
    ctx.from?.id !== 6605675131
  ) {
    await ctx.reply('⛔︎ Действие недоступно');
    return;
  }
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

// Keyboard handlers
bot.hears(BUTTON_LABELS.subscribe, subscription);
bot.hears(BUTTON_LABELS.buyTokens, topup);
bot.hears(BUTTON_LABELS.profile, myProfile);
bot.hears(BUTTON_LABELS.image, generateImage);
bot.hears([BUTTON_LABELS.settings, BUTTON_LABELS.settingsNew], settings);
bot.hears(BUTTON_LABELS.help, help);
bot.hears(BUTTON_LABELS.support, support);

// Voice message handler
bot.on('message:voice', async (ctx) => {
  await answerWithGPT(ctx, 'voice');
});
// Text message handler
bot.on('message:text', async (ctx) => {
  await answerWithGPT(ctx, 'text');
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
    if (e.error_code === 403 && /block/.test(e.description)) {
      await setUserBlocked(e.payload.chat_id as number);
      return;
    }
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
