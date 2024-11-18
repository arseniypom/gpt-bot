import { User as TelegramUser } from '@grammyjs/types';
import { InlineKeyboard } from 'grammy';
import { v4 as uuidv4 } from 'uuid';
import { type MyConversation, type MyContext } from '../types/types';
import { logError } from '../utils/utilFunctions';
import { TOKEN_PACKAGES } from '../bot-token-packages';
import { ICreatePayment } from '../types/yookassaTypes';
import yookassaService from '../utils/yookassaService';
import {
  SUPPORT_MESSAGE_POSTFIX,
  YOOKASSA_PAYMENT_MESSAGE,
} from '../utils/consts';

const cancelKeyboard = new InlineKeyboard()
  .text('← Назад', 'backToTopup')
  .text('❌ Отменить', 'cancelPayment');

export async function buyTokensConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  const packageKey = ctx.session.packageName;

  if (!packageKey) {
    ctx.reply('Пожалуйста, выберите пакет повторно с помощью команды /topup');
    return;
  }

  const { id } = ctx.from as TelegramUser;

  // Getting and validating email
  let email = '';
  let isEmailValid = false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let isFirstAttempt = true;
  const { price, description, tokensNumber } = TOKEN_PACKAGES[packageKey];
  const messagePrefix = `*Выбран пакет:*\n 🪙 ${description}`;

  do {
    const requestText = isFirstAttempt
      ? `${messagePrefix}\n\nПожалуйста, введите Ваш email \\(нужен только для отправки чека\\):`
      : 'Кажется, Вы ввели некорректный email\\. Попробуйте ещё раз:';
    await ctx.reply(requestText, {
      parse_mode: 'MarkdownV2',
      reply_markup: cancelKeyboard,
    });
    const { message } = await conversation.waitFor('message:text');

    if (!emailRegex.test(message.text)) {
      isFirstAttempt = false;
    } else {
      email = message.text;
      isEmailValid = true;
    }
  } while (!isEmailValid);

  // Creating payment
  try {
    const packageData = TOKEN_PACKAGES[packageKey];

    const idempotenceKey = uuidv4();

    const amountObj = {
      value: `${price}.00`,
      currency: 'RUB',
    };

    const createPayload: ICreatePayment = {
      amount: amountObj,
      confirmation: {
        type: 'redirect',
        return_url: 'https://gpt-bot-frontend.vercel.app/',
      },
      capture: true,
      description: packageData.description,
      receipt: {
        customer: {
          email,
        },
        items: [
          {
            description: packageData.description,
            quantity: 1,
            amount: amountObj,
            vat_code: 1,
          },
        ],
      },
      metadata: {
        telegramId: id,
        packageName: packageKey,
        tokensNumber,
      },
    };

    const paymentObj = await yookassaService.createPayment(
      createPayload,
      idempotenceKey,
    );

    const paymentUrl = paymentObj.confirmation.confirmation_url;
    if (!paymentUrl) {
      throw new Error(
        `Payment URL is not defined: ${JSON.stringify(paymentObj)}`,
      );
    }

    const paymentKeyboard = new InlineKeyboard().url('Оплатить', paymentUrl);

    await ctx.reply(YOOKASSA_PAYMENT_MESSAGE, {
      parse_mode: 'MarkdownV2',
      reply_markup: paymentKeyboard,
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при создании ссылки для оплаты. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in buyTokensConversation',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }

  return;
}
