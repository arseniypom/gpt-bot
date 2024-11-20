import { InlineKeyboard } from 'grammy';
import { type MyConversation, type MyContext } from '../types/types';
import { logError, sendMessageToAdmin } from '../utils/utilFunctions';
import { SUPPORT_MESSAGE } from '../utils/consts';

const cancelKeyboard = new InlineKeyboard().text(
  '❌ Отменить',
  'cancelSupport',
);

export async function supportConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  try {
    await ctx.reply(SUPPORT_MESSAGE, {
      reply_markup: cancelKeyboard,
      parse_mode: 'MarkdownV2',
    });

    const { message } = await conversation.waitFor('message:text');
    sendMessageToAdmin(
      `
🚨 SUPPORT MESSAGE

Username: @${ctx.from?.username}
User ID: ${ctx.from?.id}
Message: "${message.text}"
    `,
    );

    await ctx.reply(
      'Ваше обращение отправлено на рассмотрение! Мы разберемся и ответим как можно скорее 🙌',
    );
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при отправке сообщения в поддержку. Извините за доставленные неудобства, мы уже разбираемся.',
    );
    logError({
      message: 'Error in support conversation',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }

  return;
}
