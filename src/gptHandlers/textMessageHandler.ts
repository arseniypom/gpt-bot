import {
  ChatModeLabel,
  MyContext,
  SubscriptionLevels,
  UserStages,
} from '../types/types';
import { User as TelegramUser } from '@grammyjs/types';
import { AiModels } from '../types/types';
import User from '../../db/User';
import Chat from '../../db/Chat';
import Message, { IMessage } from '../../db/Message';
import { answerWithChatGPT } from '../utils/gpt';
import {
  BASIC_REQUEST_COST,
  getNoBalanceMessage,
  MAX_BOT_MESSAGE_LENGTH,
  MAX_HISTORY_LENGTH_FREE,
  MAX_HISTORY_LENGTH_START_OPTIMUM,
  MAX_HISTORY_LENGTH_PREMIUM_ULTRA,
  MAX_USER_MESSAGE_LENGTH,
  PRO_REQUEST_COST,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import { getTopupAndChangeModelKeyboard } from '../commands/topup';
import { logError } from '../utils/utilFunctions';

export const handleTextMessage = async (ctx: MyContext) => {
  try {
    if (!ctx.message || !ctx.message.text) {
      throw new Error('No message or message text');
    }

    let chatId = ctx.session.chatId;
    let chatObj;
    const telegramId = (ctx.from as TelegramUser).id;
    const userMessageText = ctx.message.text;

    if (userMessageText.length > MAX_USER_MESSAGE_LENGTH) {
      await ctx.reply(
        'Превышен лимит символов. Пожалуйста, сократите Ваше сообщение.',
      );
      return;
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start');
      return;
    }

    if (!ctx.session.isNotifiedAboutChatMode) {
      const chatModeLabel = ChatModeLabel[user.chatMode];
      const description =
        user.chatMode === 'basic'
          ? 'Бот не запоминает историю чата'
          : 'Бот запоминает историю чата и может вести диалог';
      await ctx.reply(
        `*Режим чата: ${chatModeLabel}*\n_→ ${description}_\nСменить режим: /settings`,
        {
          parse_mode: 'MarkdownV2',
        },
      );
      ctx.session.isNotifiedAboutChatMode = true;
    }

    const responseMessage = await ctx.reply('⏳ Загрузка...');

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
        user.proRequestsLeftThisMonth === 0 &&
        user.tokensBalance - PRO_REQUEST_COST < 0
      ) {
        await responseMessage.editText(
          getNoBalanceMessage({
            reqType: user.selectedModel,
            canActivateTrial: user.canActivateTrial,
            isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
          }),
          {
            reply_markup: getTopupAndChangeModelKeyboard(
              user.subscriptionLevel,
            ),
            parse_mode: 'MarkdownV2',
          },
        );
        return;
      }
    } else if (AiModels[user.selectedModel] === AiModels.GPT_4O_MINI) {
      if (
        user.basicRequestsLeftThisWeek === 0 &&
        user.basicRequestsLeftToday === 0 &&
        user.tokensBalance - BASIC_REQUEST_COST < 0
      ) {
        await responseMessage.editText(
          getNoBalanceMessage({
            reqType: user.selectedModel,
            canActivateTrial: user.canActivateTrial,
            isFreeUser: user.subscriptionLevel === SubscriptionLevels.FREE,
          }),
          {
            reply_markup: getTopupAndChangeModelKeyboard(
              user.subscriptionLevel,
            ),
            parse_mode: 'MarkdownV2',
          },
        );
        return;
      }
    } else {
      throw new Error('Invalid model: ' + user.selectedModel);
    }

    const userMessage = await Message.create({
      chatId: chat._id,
      userId: user._id,
      role: 'user',
      content: userMessageText,
    });

    let history: IMessage[] = [];
    if (user.chatMode === 'dialogue') {
      let maxHistoryLength;
      switch (user.subscriptionLevel) {
        case SubscriptionLevels.START:
        case SubscriptionLevels.OPTIMUM:
        case SubscriptionLevels.OPTIMUM_TRIAL:
          maxHistoryLength = MAX_HISTORY_LENGTH_START_OPTIMUM;
          break;
        case SubscriptionLevels.PREMIUM:
        case SubscriptionLevels.ULTRA:
          maxHistoryLength = MAX_HISTORY_LENGTH_PREMIUM_ULTRA;
          break;
        default:
          maxHistoryLength = MAX_HISTORY_LENGTH_FREE;
          break;
      }
      const messages = await Message.find({ chatId: chat._id })
        .sort({ createdAt: 1 })
        .lean();
      history = messages.slice(-maxHistoryLength);
    } else {
      history = [userMessage.toJSON()];
    }

    const selectedModelName = user.selectedModel;
    const answer = await answerWithChatGPT({
      chatHistory: history,
      telegramId,
      chatMode: user.chatMode,
      modelName: selectedModelName,
    });

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
      if (user.proRequestsLeftThisMonth > 0) {
        user.proRequestsLeftThisMonth -= 1;
      } else {
        user.tokensBalance -= PRO_REQUEST_COST;
      }
      user.stats.proReqsMade += 1;
    } else {
      if (user.basicRequestsLeftThisWeek > 0) {
        user.basicRequestsLeftThisWeek -= 1;
      } else if (user.basicRequestsLeftToday > 0) {
        user.basicRequestsLeftToday -= 1;
      } else {
        user.tokensBalance -= BASIC_REQUEST_COST;
      }
      user.stats.basicReqsMade += 1;
    }
    user.markModified('stats');
    // if (
    //   user.subscriptionLevel === 'FREE' &&
    //   user.userStage === UserStages.SUBSCRIBED_TO_CHANNEL
    // ) {
    //   user.userStage = UserStages.USED_FREE_REQUESTS;
    // }
    // Temporary disable channel check
    if (
      user.subscriptionLevel === SubscriptionLevels.FREE &&
      (user.userStage === UserStages.REGISTERED ||
        user.userStage === UserStages.SUBSCRIBED_TO_CHANNEL)
    ) {
      user.userStage = UserStages.USED_FREE_REQUESTS;
    }
    user.updatedAt = new Date();
    await user.save();

    if (answer.length > MAX_BOT_MESSAGE_LENGTH) {
      const chunks =
        answer.match(new RegExp(`[^]{1,${MAX_BOT_MESSAGE_LENGTH}}`, 'g')) || [];
      await responseMessage.editText(chunks[0]!);
      for (let i = 1; i < chunks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await ctx.reply(chunks[i]);
      }
    } else {
      await responseMessage.editText(answer);
    }
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при обработке запроса. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in handleTextMessage',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
