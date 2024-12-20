import User from '../../db/User';
import { AiRequestMode, ChatModeLabel, MyContext } from '../types/types';
import {
  FIRST_REQUEST_GIFT_MESSAGE,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import { checkUserHasSufficientBalance } from '../utils/gpt';
import { logError } from '../utils/utilFunctions';
import { handleImageMessage } from './imageMessageHandler';
import { handleTextMessage } from './textMessageHandler';
import { handleVoiceMessage } from './voiceMessageHandler';

export const answerWithGPT = async (ctx: MyContext, mode: AiRequestMode) => {
  try {
    const telegramId = ctx.from!.id;
    const user = await User.findOne({ telegramId });
    if (!user) {
      await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start');
      return;
    }

    if (
      user.stats.basicReqsMade === 0 &&
      user.stats.proReqsMade === 0 &&
      user.stats.imgGensMade === 0
    ) {
      user.tokensBalance += 20;
      await user.save();
      await ctx.reply(FIRST_REQUEST_GIFT_MESSAGE, {
        parse_mode: 'MarkdownV2',
      });
    } else if (mode === 'imageVision') {
      if (!ctx.session.isNotifiedAboutImageMode) {
        await ctx.reply(
          `*Режим обработки изображений*\n_→ В этом режиме бот анализирует изображение и выполняет задачу, подписанную Вами в сообщении с фото\\.\n❗ В настоящий момент при обработке изображений доступен только режим "Обычный", в котором бот не запоминает историю чата, а также может принимать только ОДНО изображение\\._`,
          {
            parse_mode: 'MarkdownV2',
          },
        );
        ctx.session.isNotifiedAboutImageMode = true;
      }
    } else if (!ctx.session.isNotifiedAboutChatMode) {
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

    const hasSufficientBalance = await checkUserHasSufficientBalance({
      user,
      responseMessage,
      mode,
    });

    if (!hasSufficientBalance) {
      return;
    }

    if (mode === 'text') {
      await handleTextMessage({
        user,
        ctx,
        responseMessage,
        messageText: ctx.message!.text!,
      });
    } else if (mode === 'voice') {
      await handleVoiceMessage({ user, ctx, responseMessage });
    } else if (mode === 'imageVision') {
      await handleImageMessage({ user, ctx, responseMessage });
    }
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при обработке запроса. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in answerWithGPT',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
