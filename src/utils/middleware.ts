import { InlineKeyboard, NextFunction } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { logError, setUserBlocked } from './utilFunctions';
import { MyContext, SubscriptionLevels } from '../types/types';
import { isMyContext } from '../types/typeguards';
import logger from './logger';
import { BUTTON_LABELS, SUPPORT_MESSAGE_POSTFIX } from './consts';
import { checkIsChannelMember } from '../commands/start';
import { getChannelTelegramName } from '../utils/utilFunctions';

const channelTelegramName = getChannelTelegramName();
if (!channelTelegramName) {
  throw new Error('Env var CHANNEL_TELEGRAM_NAME_* is not defined');
}

const subscribeToChannelKeyboard = new InlineKeyboard()
  .url('Перейти в канал', `https://t.me/${channelTelegramName}`)
  .row()
  .text('✅ Я подписался(лась) на канал', 'checkChannelJoin');

export const checkUserInDB = async (
  ctx: MyContext | { chat: { type: 'private' | 'channel' } },
  next: NextFunction,
): Promise<void> => {
  if (ctx.chat?.type === 'channel') {
    return;
  }

  const whiteListCallbackQueries = [
    'startStep2',
    'startStep3',
    'startStep4',
    'startStep5',
    'startStep6',
    'startStep7',
    `${SubscriptionLevels.OPTIMUM_TRIAL}-step5`,
    'startSkip',
  ];

  const hasUnblockedBot =
    isMyContext(ctx) &&
    ctx.update.my_chat_member?.old_chat_member.status === 'kicked' &&
    ctx.update.my_chat_member?.new_chat_member.status === 'member';

  if (
    !isMyContext(ctx) ||
    ctx.hasCommand('start') ||
    ctx.hasCommand('support') ||
    (await ctx.conversation.active())?.supportConversation ||
    ctx.message?.text === BUTTON_LABELS.support ||
    whiteListCallbackQueries.includes(ctx.callbackQuery?.data || '') ||
    hasUnblockedBot
  ) {
    await next();
    return;
  }

  try {
    const { id } = ctx.from as TelegramUser;

    if (ctx?.update.my_chat_member?.new_chat_member.status === 'kicked') {
      await setUserBlocked(id);
      return;
    }

    // Temporary disable channel check
    // const isChannelMember = await checkIsChannelMember(id);

    // if (isChannelMember) {
    //   await next();
    //   return;
    // }

    await next();
    return;


    // if (
    //   ctx.callbackQuery?.data === 'checkChannelJoin' ||
    //   ctx.callbackQuery?.data === 'checkChannelJoinAndGoToStep6' ||
    //   ctx.callbackQuery?.data === 'checkChannelJoinAndBuyTrial'
    // ) {
    //   await ctx.answerCallbackQuery({
    //     text: 'Не нашли Вас в числе подписчиков 🤔 Пожалуйста, подпишитесь и нажмите на кнопку снова',
    //     show_alert: true,
    //   });
    //   return;
    // }
    // if (ctx.callbackQuery) {
    //   await ctx.answerCallbackQuery();
    // }

    // await ctx.reply(
    //   `Чтобы пользоваться ботом, Вам необходимо подписаться на канал [Кухня ИИ](https://t.me/${channelTelegramName}) 🔗\n\n_🔐 Это сделано для защиты от спама и вредоносных ботов, чтобы обеспечить пользователям комфортный бесперебойный доступ к ChatGPT_\\.\n\nПожалуйста, подпишитесь и нажмите на кнопку "✅ Я подписался\\(лась\\) на канал"`,
    //   {
    //     parse_mode: 'MarkdownV2',
    //     reply_markup: subscribeToChannelKeyboard,
    //   },
    // );
    // return;
  } catch (error) {
    logError({
      message: 'Middleware: Error checking user channel membership',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
    await ctx.reply(`Произошла ошибка. ${SUPPORT_MESSAGE_POSTFIX}`);
  }
};

export const ignoreOld = async (
  ctx: MyContext,
  next: NextFunction,
): Promise<void> => {
  // 5 mins threshold
  const threshold = 5 * 60;
  if (
    !ctx.callbackQuery &&
    ctx.msg?.date &&
    new Date().getTime() / 1000 - ctx.msg.date > threshold
  ) {
    logger.info(
      `Ignoring message | TEXT: '${ctx.msg.text}' | USER ID: '${
        ctx.from?.id
      }' | CHAT ID: '${ctx.chat?.id}' (${new Date().getTime() / 1000}:${
        ctx.msg.date
      })`,
    );
    return;
  }
  await next();
};
