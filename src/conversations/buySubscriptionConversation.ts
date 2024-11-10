import { User as TelegramUser } from '@grammyjs/types';
import { InlineKeyboard } from 'grammy';
import { v4 as uuidv4 } from 'uuid';
import { type MyConversation, type MyContext } from '../types/types';
import { logError } from '../utils/utilFunctions';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import { ICreatePayment } from '../types/yookassaTypes';
import yookassaService from '../utils/yookassaService';
import {
  SUPPORT_MESSAGE_POSTFIX,
  YOOKASSA_PAYMENT_MESSAGE,
} from '../utils/consts';
import { isValidSubscriptionDuration } from '../types/typeguards';

const cancelKeyboard = new InlineKeyboard().text(
  '❌ Отменить',
  'cancelSubscription',
);

export async function buySubscriptionConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  const subscriptionLevel = ctx.session.subscriptionLevel;

  if (!subscriptionLevel) {
    ctx.reply(
      'Пожалуйста, выберите тариф подписки повторно с помощью команды /subscription',
    );
    return;
  }

  const { id } = ctx.from as TelegramUser;

  // Getting and validating email
  let email = '';
  let isEmailValid = false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let isFirstAttempt = true;
  const { icon, description, title } = SUBSCRIPTIONS[subscriptionLevel];
  const messagePrefix = `*Выбран тариф: ${icon} ${title}*\nОписание: ${description}`;

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
    const subscriptionData = SUBSCRIPTIONS[subscriptionLevel];

    const idempotenceKey = uuidv4();

    const amountObj = {
      value: `${subscriptionData.price}.00`,
      currency: 'RUB',
    };

    const subscriptionDuration = isValidSubscriptionDuration(
      subscriptionData.duration,
    )
      ? subscriptionData.duration
      : { months: 1 };

    const createPayload: ICreatePayment = {
      amount: amountObj,
      confirmation: {
        type: 'redirect',
        return_url: 'https://gpt-bot-frontend.vercel.app/',
      },
      capture: true,
      description: subscriptionData.description,
      receipt: {
        customer: {
          email,
        },
        items: [
          {
            description: subscriptionData.description,
            quantity: 1,
            amount: amountObj,
            vat_code: 1,
          },
        ],
      },
      metadata: {
        telegramId: id,
        subscriptionLevel,
        basicRequestsPerWeek: subscriptionData.basicRequestsPerWeek,
        basicRequestsPerDay: subscriptionData.basicRequestsPerDay,
        proRequestsPerMonth: subscriptionData.proRequestsPerMonth,
        imageGenerationPerMonth: subscriptionData.imageGenerationPerMonth,
        subscriptionDuration: JSON.stringify(subscriptionDuration),
      },
      save_payment_method: true,
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
