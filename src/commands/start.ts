import 'dotenv/config';
import { User as TelegramUser } from '@grammyjs/types';
import { logError } from '../utils/utilFunctions';
import { START_MESSAGE_V2, SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';
import { MyContext } from '../types/types';
import User from '../../db/User';
import Chat from '../../db/Chat';
import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import bot from '../../bot';
import { getChannelTelegramName } from '../utils/utilFunctions';

const channelTelegramName = getChannelTelegramName();

if (!channelTelegramName) {
  throw new Error('Env var CHANNEL_TELEGRAM_NAME_* is not defined');
}

const startKeyboard = new InlineKeyboard()
  .url('Ссылка на канал', `https://t.me/${channelTelegramName}`)
  .row()
  .text('Проверить подписку', 'checkSubscriptionAndRegisterUser');

export const start = async (ctx: MyContext) => {
  await ctx.reply(
    'Чтобы пользоваться ботом, Вам необходимо подписаться на наш канал по ссылке ниже 👇\n\nЭто сделано для защиты от спама и вредоносных ботов\\.\nПожалуйста, подпишитесь и нажмите на кнопку "Проверить подписку"',
    {
      parse_mode: 'MarkdownV2',
      reply_markup: startKeyboard,
    },
  );
};

export const checkSubscriptionAndRegisterUser = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();
  const { id, username } = ctx.from as TelegramUser;
  try {
    const member = await bot.api.getChatMember(`@${channelTelegramName}`, id);
    switch (member.status) {
      case 'creator':
      case 'administrator':
      case 'member':
        await ctx.callbackQuery.message?.editText(
          'Подписка оформлена ✅\nВы можете пользоваться ботом.',
        );
        await registerUser(ctx);
        break;
      case 'restricted':
      case 'left':
      case 'kicked':
        await ctx.callbackQuery.message?.editText(
          'Мы не нашли Вас в числе подписчиков канала 🙁\nПожалуйста, подпишитесь и нажмите "Проверить подписку"\n\nЕсли Вы убедились, что подписаны, но по-прежнему получаете это сообщение, попробуйте нажать "Проверить подписку" еще раз или обратитесь в поддержку /support',
          {
            reply_markup: startKeyboard,
          },
        );
        break;
    }
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при проверке подписки на канал. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in checkSubscriptionAndRegisterUser callbackQuery',
      error,
      telegramId: id,
      username,
    });
  }
};

export const registerUser = async (ctx: CallbackQueryContext<MyContext>) => {
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
      await responseMsg.editText(
        'Ваш персональный чат-бот создан. Пожалуйста, введите запрос',
      );

      const chat = await Chat.create({
        userId: user._id,
      });

      ctx.session.chatId = chat._id.toString();
    } else {
      await ctx.reply(
        'Посмотрите свой баланс /balance или напишите запрос, и я помогу Вам с ним!',
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
