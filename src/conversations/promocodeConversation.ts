import { InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { type MyConversation, type MyContext } from '../types/types';
import { logError } from '../utils/utilFunctions';
import Promocode from '../../db/Promocode';
import User from '../../db/User';
import { SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';

const cancelKeyboard = new InlineKeyboard().text(
  '❌ Отменить',
  'cancelPromocode',
);

export async function promocodeConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  try {
    const { id } = ctx.from as TelegramUser;

    await ctx.reply('Введите промокод', {
      reply_markup: cancelKeyboard,
      parse_mode: 'MarkdownV2',
    });

    const { message } = await conversation.waitFor('message:text');

    const promocode = await Promocode.findOne({ code: message.text.trim() });
    if (!promocode) {
      await ctx.reply('Промокод не найден 🤔');
      return;
    }
    if (promocode.validUntil && promocode.validUntil < new Date()) {
      await ctx.reply('К сожалению, срок действия промокода истек ⌛');
      return;
    }
    if (
      promocode.timesUsedLimit &&
      promocode.timesUsed >= promocode.timesUsedLimit
    ) {
      await ctx.reply(
        'К сожалению, промокод уже использован максимальное количество раз 🚫',
      );
      return;
    }

    const user = await conversation.external(() =>
      User.findOne({ telegramId: id }),
    );
    if (!user) {
      await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start');
      return;
    }
    if (user.usedPromocodes.includes(promocode.code)) {
      await ctx.reply('Промокод уже применен 🚫');
      return;
    }

    const date = await conversation.external(() => new Date());
    if (promocode.tokenAmount) {
      await conversation.external(() =>
        User.updateOne(
          { telegramId: id },
          {
            updatedAt: date,
            tokensBalance: user.tokensBalance + promocode.tokenAmount!,
            usedPromocodes: [...user.usedPromocodes, promocode.code],
          },
        ),
      );
      await conversation.external(() =>
        Promocode.updateOne(
          { code: promocode.code },
          {
            updatedAt: date,
            timesUsed: promocode.timesUsed + 1,
          },
        ),
      );
    }

    await ctx.reply(
      '*Промокод успешно применен\\!* 🎉\nЧтобы проверить баланс токенов, используйте команду /profile или нажмите кнопку "👤 Мой профиль" в меню ↓',
      {
        parse_mode: 'MarkdownV2',
      },
    );
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при применении промокода. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in promocode conversation',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }

  return;
}
