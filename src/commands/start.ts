import 'dotenv/config';
import { User as TelegramUser } from '@grammyjs/types';
import { logError } from '../utils/utilFunctions';
import {
  BUTTON_LABELS,
  START_MESSAGE_V2,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import { MyContext, SubscriptionLevels } from '../types/types';
import User from '../../db/User';
import Chat from '../../db/Chat';
import { CallbackQueryContext, InlineKeyboard, Keyboard } from 'grammy';
import bot from '../../bot';
import { getChannelTelegramName } from '../utils/utilFunctions';

const channelTelegramName = getChannelTelegramName();
const isRegistrationEnabled =
  process.env.NEW_USERS_REGISTRATION_AVAILABLE === 'true';

if (!channelTelegramName) {
  throw new Error('Env var CHANNEL_TELEGRAM_NAME_* is not defined');
}

export const checkIsChannelMember = async (tgId: number) => {
  const member = await bot.api.getChatMember(`@${channelTelegramName}`, tgId);
  switch (member.status) {
    case 'creator':
    case 'administrator':
    case 'member':
      return true;
    case 'restricted':
    case 'left':
    case 'kicked':
      return false;
    default:
      return false;
  }
};

export const mainKeyboard = new Keyboard()
  .text(BUTTON_LABELS.profile)
  .text(BUTTON_LABELS.settings)
  .row()
  .text(BUTTON_LABELS.subscribe)
  .row()
  .text(BUTTON_LABELS.image)
  .row()
  .text(BUTTON_LABELS.help)
  .text(BUTTON_LABELS.support)
  .resized()
  .persistent();

export const mainSubscribedUserKeyboard = new Keyboard()
  .text(BUTTON_LABELS.profile)
  .text(BUTTON_LABELS.settings)
  .row()
  .text(BUTTON_LABELS.buyTokens)
  .row()
  .text(BUTTON_LABELS.image)
  .row()
  .text(BUTTON_LABELS.help)
  .text(BUTTON_LABELS.support)
  .resized()
  .persistent();

export const start = async (ctx: MyContext) => {
  if (!isRegistrationEnabled) {
    await ctx.reply(
      'К сожалению, регистрация новых пользователей временно приостановлена',
    );
    return;
  }

  const { id, first_name, username } = ctx.from as TelegramUser;

  await ctx.reply(START_MESSAGE_V2, {
    parse_mode: 'MarkdownV2',
    link_preview_options: {
      is_disabled: true,
    },
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
      await responseMsg.delete();
      await ctx.reply(
        'Ваш персональный чат-бот создан! Чтобы начать чат, просто напишите сообщение 💬\n\nПодробнее – кнопка "ℹ️ Информация" ↓',
        {
          reply_markup: mainKeyboard,
        },
      );

      const chat = await Chat.create({
        userId: user._id,
      });

      ctx.session.chatId = chat._id.toString();
    } else {
      const isSubscribed = user.subscriptionLevel !== SubscriptionLevels.FREE;
      await ctx.reply(
        'Чем я могу Вам помочь? Напишите запрос или выберите команду из меню ↓',
        {
          reply_markup: isSubscribed
            ? mainSubscribedUserKeyboard
            : mainKeyboard,
        },
      );
    }
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при создании персонального чат-бота. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in /start command',
      error,
      telegramId: id,
      username,
    });
  }
};
