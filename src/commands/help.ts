import { CallbackQueryContext, InlineKeyboard, InputFile } from 'grammy';
import { HelpMessage, MyContext } from '../types/types';
import {
  HELP_MASSAGE_MAIN,
  HELP_MESSAGE_FIND_MENU,
  HELP_MESSAGE_CHAT_MODES,
  HELP_MESSAGE_HOW_TO_USE_BOT,
  HELP_MESSAGE_MODELS,
  HELP_MESSAGE_REQUESTS,
  HELP_MESSAGE_TOKENS,
  SUPPORT_MESSAGE_POSTFIX,
  SUBSCRIPTIONS_MESSAGE,
  SUBSCRIPTIONS_MESSAGE_WITH_TRIAL,
} from '../utils/consts';
import { logError } from '../utils/utilFunctions';
import { getSubscriptionLevelsKeyboard } from './subscription';
import User from '../../db/User';

const helpMainKeyboard = new InlineKeyboard()
  .text('Как открыть меню с кнопками?', 'helpFindMenu')
  .row()
  .text('Что такое "запрос"?', 'helpRequests')
  .row()
  .text('Как отправить запрос в ИИ и сгенерировать изображение?', 'helpHowToUseBot')
  .row()
  .text('В чем разница ИИ-моделей?', 'helpModels')
  .row()
  .text('Что даёт подписка?', 'helpSubscription')
  .row()
  .text('Что такое "токены"?', 'helpTokens')
  .row()
  .text('Режимы чата: Обычный и Диалог', 'helpChatModes');

const helpBackKeyboard = new InlineKeyboard().text('← Назад', 'helpBack');
const helpBackAndSubscriptionModelsKeyboard = new InlineKeyboard()
  .text('Разница между ИИ-моделями', 'helpModels')
  .row()
  .text('Расскажи про подписку!', 'helpSubscription')
  .row()
  .text('← Назад', 'helpBack');
const helpBackAndSubscriptionTokensKeyboard = new InlineKeyboard()
  .text('Расскажи про подписку!', 'helpSubscription')
  .row()
  .text('Что такое токены?', 'helpTokens')
  .row()
  .text('← Назад', 'helpBack');
const helpBackFindMenuKeyboard = new InlineKeyboard().text(
  '← Назад',
  'helpBackFindMenu',
);

export const help = async (ctx: MyContext) => {
  await ctx.reply(HELP_MASSAGE_MAIN, {
    parse_mode: 'MarkdownV2',
    reply_markup: helpMainKeyboard,
  });
};

export const helpMessagesHandler = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();
  try {
    const data = ctx.callbackQuery.data as HelpMessage;
    let helpResponseMessage: string = '';
    switch (data) {
      case 'helpFindMenu':
        await ctx.replyWithPhoto(
          new InputFile('src/images/keyboard-help-img.jpg'),
          {
            caption: HELP_MESSAGE_FIND_MENU,
            parse_mode: 'MarkdownV2',
            reply_markup: helpBackFindMenuKeyboard,
          },
        );
        return;
      case 'helpHowToUseBot':
        helpResponseMessage = HELP_MESSAGE_HOW_TO_USE_BOT;
        break;
      case 'helpRequests':
        await ctx.callbackQuery.message?.editText(HELP_MESSAGE_REQUESTS, {
          parse_mode: 'MarkdownV2',
          reply_markup: helpBackAndSubscriptionModelsKeyboard,
        });
        return;
      case 'helpModels':
        await ctx.callbackQuery.message?.editText(HELP_MESSAGE_MODELS, {
          parse_mode: 'MarkdownV2',
          reply_markup: helpBackAndSubscriptionTokensKeyboard,
        });
        return;
      case 'helpTokens':
        helpResponseMessage = HELP_MESSAGE_TOKENS;
        break;
      case 'helpSubscription':
        const user = await User.findOne({ telegramId: ctx.from?.id });
        if (!user) {
          await ctx.reply('Пожалуйста, начните с команды /start');
          return;
        }
        const message = user.canActivateTrial
          ? SUBSCRIPTIONS_MESSAGE_WITH_TRIAL
          : SUBSCRIPTIONS_MESSAGE;
        await ctx.callbackQuery.message?.editText(
          message.replace(/[().-]/g, '\\$&'),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: getSubscriptionLevelsKeyboard({
              isHelp: true,
              canActivateTrial: user.canActivateTrial,
            }),
          },
        );
        return;
      case 'helpChatModes':
        helpResponseMessage = HELP_MESSAGE_CHAT_MODES;
        break;
      default:
        break;
    }
    await ctx.callbackQuery.message?.editText(helpResponseMessage, {
      parse_mode: 'MarkdownV2',
      reply_markup: helpBackKeyboard,
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при обработке запроса. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in helpMessagesHandler',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};

export const helpBackHandler = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  try {
    if (ctx.callbackQuery.data === 'helpBackFindMenu') {
      await ctx.callbackQuery.message?.delete();
      return;
    }
    await ctx.callbackQuery.message?.editText(HELP_MASSAGE_MAIN, {
      parse_mode: 'MarkdownV2',
      reply_markup: helpMainKeyboard,
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при обработке запроса. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in helpBackHandler',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
