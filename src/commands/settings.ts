import { User as TelegramUser } from '@grammyjs/types';
import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { logError } from '../utils/utilFunctions';
import { AiModelsLabels, ChatMode, MyContext } from '../types/types';
import User from '../../db/User';
import { getSettingsMessage, SUPPORT_MESSAGE_POSTFIX } from '../utils/consts';
import { isValidAiModel } from '../types/typeguards';
import Chat from '../../db/Chat';

const getSettingsKeyboard = (activeModel: AiModelsLabels, chatMode: ChatMode) =>
  new InlineKeyboard()
    .text(`⚪ ${AiModelsLabels.GPT_4O_MINI}`, 'GPT_4O_MINI')
    .text(`🔘 ${AiModelsLabels.GPT_4O}`, 'GPT_4O')
    .row()
    .text('Обычный', 'basic')
    .text('Диалог', 'dialogue')
    .row()
    .text('Начать новый чат', 'newChat');

export const getSettingsKeyboardv2 = (
  activeModel: AiModelsLabels,
  activeChatMode: ChatMode,
) => {
  const aiModelsBtns = Object.entries(AiModelsLabels).map(([name, label]) => {
    const isActive = activeModel === label;
    const labelText = isActive ? `🔘 ${label}` : `⚪ ${label}`;
    return [labelText, name];
  });
  // const chatModesBtns = Object.entries(ChatModes).map(([name, label]) => {
  //   const isActive = activeChatMode === label;
  //   const labelText = isActive ? `🔘 ${label}` : `⚪ ${label}`;
  //   return [labelText, name];
  // });
  const chatModesBtns = [
    ['basic', 'Обычный'],
    ['dialogue', 'Диалог'],
  ].map(([name, label]) => {
    const isActive = activeChatMode === name;
    const labelText = isActive ? `🔘 ${label}` : `⚪ ${label}`;
    return [labelText, name];
  });
  const aiModelsRow = aiModelsBtns.map(([label, data]) =>
    InlineKeyboard.text(label, data),
  );
  const chatModesRow = chatModesBtns.map(([label, data]) =>
    InlineKeyboard.text(label, data),
  );
  return InlineKeyboard.from([
    [...aiModelsRow],
    [...chatModesRow],
    [InlineKeyboard.text('Начать новый чат', 'newChat')],
  ]);
};

export const settings = async (ctx: MyContext) => {
  const { id } = ctx.from as TelegramUser;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }
    const chatMode = user.chatMode;
    const activeModel = AiModelsLabels[user.selectedModel];
    await ctx.reply(getSettingsMessage(activeModel, chatMode), {
      parse_mode: 'MarkdownV2',
      reply_markup: getSettingsKeyboardv2(activeModel, chatMode),
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при получении настроек. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in /settings command',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};

export const settingsChangeModel = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();

  const selectedModel = ctx.callbackQuery.data;
  if (!isValidAiModel(selectedModel)) {
    await ctx.callbackQuery.message?.editText(
      `Что-то пошло не так при выборе модели. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    return;
  }

  const { id } = ctx.from;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }
    if (selectedModel === user.selectedModel) {
      return;
    }

    const chatMode = user.chatMode;
    const activeModel = AiModelsLabels[selectedModel];
    user.selectedModel = selectedModel;
    user.updatedAt = new Date();
    await user.save();

    await ctx.callbackQuery.message?.editText(
      getSettingsMessage(activeModel, chatMode),
      {
        reply_markup: getSettingsKeyboardv2(
          AiModelsLabels[selectedModel],
          chatMode,
        ),
        parse_mode: 'MarkdownV2',
      },
    );
    return;
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при изменении модели. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in settingsChangeModel callbackQuery',
      error,
      telegramId: id,
      username: ctx.from.username,
    });
  }
};

export const settingsChangeChatMode = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();

  const chatMode = ctx.callbackQuery.data as ChatMode;

  const { id } = ctx.from;

  try {
    const user = await User.findOne({ telegramId: id });
    if (!user) {
      await ctx.reply('Пожалуйста, начните с команды /start.');
      return;
    }
    if (user.chatMode === chatMode) {
      return;
    }
    const activeModel = AiModelsLabels[user.selectedModel];
    user.chatMode = chatMode;
    await user.save();

    if (chatMode === 'dialogue') {
      const chat = await Chat.create({
        userId: user._id,
      });
      ctx.session.chatId = chat._id.toString();
    }

    user.updatedAt = new Date();
    await user.save();

    await ctx.callbackQuery.message?.editText(
      getSettingsMessage(activeModel, chatMode),
      {
        reply_markup: getSettingsKeyboardv2(activeModel, chatMode),
        parse_mode: 'MarkdownV2',
      },
    );
    return;
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при изменении режима чата. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in settingsChangeChatMode callbackQuery',
      error,
      telegramId: id,
      username: ctx.from.username,
    });
  }
};
