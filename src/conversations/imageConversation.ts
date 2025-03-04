import 'dotenv/config';
import { InlineKeyboard } from 'grammy';
import { User as TelegramUser } from '@grammyjs/types';
import { generateImage } from '../utils/gpt';
import { logError } from '../utils/utilFunctions';
import {
  type MyConversation,
  type MyContext,
  ImageGenerationQuality,
  SubscriptionLevels,
  ImageGenerationSizes,
} from '../types/types';
import User from '../../db/User';
import {
  BUTTON_LABELS,
  getHDGenerationNotAvailableMessage,
  IMAGE_GENERATION_COST,
  INLINE_BUTTON_LABELS,
  SUPPORT_MESSAGE_POSTFIX,
} from '../utils/consts';
import Images from '../../db/Images';
import bot from '../../bot';

const cancelKeyboard = new InlineKeyboard().text(
  '❌ Отменить',
  'cancelImageGeneration',
);

export const addSubscriptionKeyboard = new InlineKeyboard().text(
  INLINE_BUTTON_LABELS.subscription,
  'subscription',
);

export const addSubscriptionKeyboardWithTrial = new InlineKeyboard()
  .text(
    INLINE_BUTTON_LABELS.subscriptionTrial,
    `${SubscriptionLevels.OPTIMUM_TRIAL}-no-delete`,
  )
  .row()
  .text(INLINE_BUTTON_LABELS.allLevels, 'subscription');

const manageSubscriptionKeyboard = new InlineKeyboard().text(
  INLINE_BUTTON_LABELS.subscriptionManage,
  'subscriptionManage',
);

export async function imageConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  try {
    const { id } = ctx.from as TelegramUser;
    const userObj = await conversation.external(() =>
      User.findOne({ telegramId: id }),
    );
    if (!userObj) {
      await ctx.reply('Пожалуйста, начните новый чат с помощью команды /start');
      return;
    }

    const isHDGenerationAvailableForUser =
      userObj.subscriptionLevel !== SubscriptionLevels.FREE &&
      userObj.subscriptionLevel !== SubscriptionLevels.START;

    if (
      conversation.session.imageQuality === ImageGenerationQuality.HD &&
      !isHDGenerationAvailableForUser
    ) {
      let keyboard;
      if (userObj.canActivateTrial) {
        keyboard = addSubscriptionKeyboardWithTrial;
      } else if (userObj.subscriptionLevel === SubscriptionLevels.FREE) {
        keyboard = addSubscriptionKeyboard;
      } else {
        keyboard = manageSubscriptionKeyboard;
      }
      await ctx.reply(
        getHDGenerationNotAvailableMessage({
          canActivateTrial: userObj.canActivateTrial,
          isFreeUser: userObj.subscriptionLevel === SubscriptionLevels.FREE,
        }),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: keyboard,
        },
      );
      return;
    }

    let size = ImageGenerationSizes.SQUARE;
    if (conversation.session.imageQuality === ImageGenerationQuality.HD) {
      size = ImageGenerationSizes.HORIZONTAL;
    }

    await ctx.reply('Опишите, что должно быть на изображении?', {
      reply_markup: cancelKeyboard,
    });

    const { message } = await conversation.waitFor('message:text');

    if (Object.values(BUTTON_LABELS).includes(message.text)) {
      await ctx.reply(
        `Генерация изображения отменена\\.\nПожалуйста, нажмите кнопку *${message.text}* повторно`,
        {
          parse_mode: 'MarkdownV2',
        },
      );
      return;
    }
    if (message.text.length > 1500) {
      await ctx.reply(
        'Превышен лимит символов. Пожалуйста, сократите Ваше сообщение и начните генерацию заново командой /image.',
      );
      return;
    }

    const responseMessage = await ctx.reply('Генерация изображения...');

    const user = await conversation.external(() =>
      User.findOne({ telegramId: id }),
    );
    let imageData;
    try {
      imageData = await generateImage(
        message.text,
        conversation.session.imageQuality,
        size,
      );
    } catch (error) {
      if (
        (error as any).status === 400 &&
        (error as any).code === 'content_policy_violation'
      ) {
        await responseMessage.editText(
          '❌ Система безопасности DALL-E отклонила Ваш запрос. Скорее всего, текст содержал ненормативную лексику, описание жестокости или иных недопустимых материалов. Если Вы считаете, что это ошибка, напишите в поддержку /support, прикрепив текст запроса.',
        );
        await conversation.external(() =>
          Images.create({
            userId: user!._id,
            prompt: message.text,
          }),
        );
        return;
      }
      throw error;
    }
    if (!imageData.url) {
      throw new Error('Image generation failed: no image URL');
    }
    await ctx.replyWithPhoto(imageData.url);
    await ctx.replyWithDocument(imageData.url, {
      caption: 'Изображение без сжатия (максимальное разрешение) 📎',
    });
    await responseMessage.editText('Готово!');

    if (
      process.env.ADMIN_TELEGRAM_ID &&
      id !== Number(process.env.ADMIN_TELEGRAM_ID)
    ) {
      await bot.api.sendPhoto(process.env.ADMIN_TELEGRAM_ID, imageData.url, {
        caption: message.text,
      });
    }

    const date = await conversation.external(() => new Date());
    if (user!.imageGenerationLeftThisMonth > 0) {
      await conversation.external(() =>
        User.updateOne(
          { telegramId: id },
          {
            updatedAt: date,
            imageGenerationLeftThisMonth:
              user!.imageGenerationLeftThisMonth - 1,
            stats: {
              ...user!.stats,
              imgGensMade: user!.stats.imgGensMade + 1,
            },
          },
        ),
      );
    } else {
      await conversation.external(() =>
        User.updateOne(
          { telegramId: id },
          {
            updatedAt: date,
            tokensBalance: user!.tokensBalance - IMAGE_GENERATION_COST,
            stats: {
              ...user!.stats,
              imgGensMade: user!.stats.imgGensMade + 1,
            },
          },
        ),
      );
    }

    await conversation.external(() =>
      Images.create({
        userId: user!._id,
        prompt: message.text,
        revisedPrompt: imageData.revisedPrompt,
      }),
    );
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при генерации изображения. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in image conversation',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }

  return;
}
