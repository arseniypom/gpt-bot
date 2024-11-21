import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import User from '../../db/User';
import { MyContext } from '../types/types';
import { logError } from '../utils/utilFunctions';
import {
  getReferralProgramMessage,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';

const referralProgramKeyboard = new InlineKeyboard().text('✖︎', 'hide');

export const referralProgram = async (ctx: CallbackQueryContext<MyContext>) => {
  ctx.answerCallbackQuery();
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }

    await ctx.reply(getReferralProgramMessage(user), {
      parse_mode: 'MarkdownV2',
      reply_markup: referralProgramKeyboard,
      link_preview_options: {
        is_disabled: true,
      },
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при получении реферальной программы. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in referralProgram CB query',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
