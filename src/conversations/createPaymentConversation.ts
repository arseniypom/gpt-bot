import { User as TelegramUser } from '@grammyjs/types';
import { InlineKeyboard } from 'grammy';
import { v4 as uuidv4 } from 'uuid';
import { type MyConversation, type MyContext } from '../types/types';
import { logError } from '../utils/utilFunctions';
import { PACKAGES } from '../bot-packages';
import { ICreatePayment } from '../types/yookassaTypes';
import yookassaService from '../utils/yookassaService';
import {
  SUPPORT_MESSAGE_POSTFIX,
  YOOKASSA_PAYMENT_MESSAGE,
} from '../utils/consts';

const cancelKeyboard = new InlineKeyboard().text(
  '❌ Отменить',
  'cancelPayment',
);

export async function createPaymentConversation(
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
  const { numberIcon, description } = PACKAGES[packageKey];
  const messagePrefix = `*Выбран пакет:*\n${numberIcon} ${description}`;

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
    const packageData = PACKAGES[packageKey];

    const idempotenceKey = uuidv4();

    const amountObj = {
      value: `${packageData.price}.00`,
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
        basicRequestsBalance: packageData.basicRequestsBalance || null,
        proRequestsBalance: packageData.proRequestsBalance || null,
        imageGenerationBalance: packageData.imageGenerationBalance || null,
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
      message: 'Error in createPaymentConversation',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }

  return;
}
