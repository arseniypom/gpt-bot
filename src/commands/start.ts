import 'dotenv/config';
import { User as TelegramUser } from '@grammyjs/types';
import { logError } from '../utils/utilFunctions';
import {
  BUTTON_LABELS,
  getSTART_MESSAGE_STEP_1,
  START_MESSAGE_STEP_2,
  START_MESSAGE_STEP_3,
  START_MESSAGE_STEP_4,
  START_MESSAGE_STEP_5,
  START_MESSAGE_STEP_6,
  START_MESSAGE_STEP_7,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import { MyContext, SubscriptionLevels } from '../types/types';
import User from '../../db/User';
import Chat from '../../db/Chat';
import {
  CallbackQueryContext,
  InlineKeyboard,
  InputFile,
  Keyboard,
} from 'grammy';
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

const step1Keyboard = new InlineKeyboard()
  .text('С чем ты можешь мне помочь?', 'startStep2')
  .row()
  .text('Пропустить знакомство', 'startSkip');

const step2Keyboard = new InlineKeyboard()
  .text('А как ты все это делаешь?', 'startStep3')
  .row()
  .text('Пропустить знакомство', 'startSkip');

const step3Keyboard = new InlineKeyboard()
  .text('И я могу пользоваться этим бесплатно?', 'startStep4')
  .row()
  .text('Пропустить знакомство', 'startSkip');

const step4Keyboard = new InlineKeyboard()
  .text('Класс, попробую Оптимум!', SubscriptionLevels.OPTIMUM_TRIAL)
  .row()
  .text('Я подумаю, продолжить', 'startStep5')
  .row()
  .text('Пропустить знакомство', 'startSkip');

const step5Keyboard = new InlineKeyboard()
  .text('Последнее: как тобой управлять?', 'startStep6')
  .row()
  .text('Пропустить знакомство', 'startSkip');

const step6Keyboard = new InlineKeyboard().text(
  'Закончить и протестировать бота!',
  'startStep7',
);

export const startStep1 = async (ctx: MyContext) => {
  if (!isRegistrationEnabled) {
    await ctx.reply(
      'К сожалению, регистрация новых пользователей временно приостановлена',
    );
    return;
  }

  const { id, first_name, username } = ctx.from as TelegramUser;

  const displayName = first_name || username;

  await ctx.reply(getSTART_MESSAGE_STEP_1(displayName), {
    parse_mode: 'MarkdownV2',
    reply_markup: step1Keyboard,
    link_preview_options: {
      is_disabled: true,
    },
  });

  try {
    let user = await User.findOne({ telegramId: id });
    if (!user) {
      user = await User.create({
        telegramId: id,
        firstName: first_name,
        userName: username,
      });
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
    }
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при регистрации Вашего персонального чат-бота. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in /start (startStep1) command',
      error,
      telegramId: id,
      username,
    });
  }
};

export const startStep2 = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(START_MESSAGE_STEP_2, {
    parse_mode: 'MarkdownV2',
    reply_markup: step2Keyboard,
  });
};

export const startStep3 = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(START_MESSAGE_STEP_3, {
    parse_mode: 'MarkdownV2',
    reply_markup: step3Keyboard,
  });
};

export const startStep4 = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(START_MESSAGE_STEP_4, {
    parse_mode: 'MarkdownV2',
    reply_markup: step4Keyboard,
  });
};

export const startStep5 = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(START_MESSAGE_STEP_5, {
    parse_mode: 'MarkdownV2',
    reply_markup: step5Keyboard,
  });
};

export const startStep6 = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  await ctx.replyWithPhoto(new InputFile('src/images/keyboard-help-img.jpg'), {
    caption: START_MESSAGE_STEP_6,
    parse_mode: 'MarkdownV2',
    reply_markup: step6Keyboard,
  });
};

export const startStep7 = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(START_MESSAGE_STEP_7, {
    parse_mode: 'MarkdownV2',
  });
};
