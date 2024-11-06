import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { v4 as uuidv4 } from 'uuid';
import bot from '../../bot';
import { ICreatePayment } from '../types/yookassaTypes';
import yookassaService from './yookassaService';
import { PACKAGES } from '../bot-packages';
import {
  getYookassaPaymentProviderToken,
  logError,
} from '../utils/utilFunctions';
import { MyContext, PackageName } from '../types/types';
import User from '../../db/User';
import TelegramTransaction from '../../db/TelegramTransaction';
import {
  getBalanceMessage,
  SUPPORT_MESSAGE_POSTFIX,
  YOOKASSA_PAYMENT_MESSAGE,
} from './consts';

export const createInvoice = async (ctx: CallbackQueryContext<MyContext>) => {
  await ctx.answerCallbackQuery();
  const packageKey = ctx.callbackQuery.data as PackageName;

  try {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      throw new Error(`${ctx.callbackQuery.data} | Chat ID is not defined`);
    }
    if (!PACKAGES[packageKey]) {
      throw new Error(
        `${ctx.callbackQuery.data} | ${packageKey} is not in PACKAGES`,
      );
    }
    const { title, price, description } = PACKAGES[packageKey];

    await ctx.reply(YOOKASSA_PAYMENT_MESSAGE, {
      parse_mode: 'MarkdownV2',
      link_preview_options: {
        is_disabled: true,
      },
    });

    const providerInvoiceData = {
      receipt: {
        items: [
          {
            description,
            quantity: 1,
            amount: {
              value: `${price}.00`,
              currency: 'RUB',
            },
            vat_code: 1,
          },
        ],
      },
    };

    await bot.api.sendInvoice(
      chatId,
      title,
      description,
      packageKey,
      'RUB',
      [
        {
          label: 'Руб',
          amount: price * 100,
        },
      ],
      {
        provider_token: getYookassaPaymentProviderToken(),
        need_email: true,
        send_email_to_provider: true,
        provider_data: JSON.stringify(providerInvoiceData),
      },
    );
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при пополнении баланса. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in topup callbackQuery',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};

export const telegramSuccessfulPaymentHandler = async (ctx: any) => {
  const { id } = ctx.from;

  try {
    const user = await User.findOne({ telegramId: id });
    const telegramTransaction = await TelegramTransaction.create({
      telegramId: id,
      totalAmount: ctx.message?.successful_payment.total_amount,
      packageName: ctx.message?.successful_payment.invoice_payload,
      telegramPaymentChargeId:
        ctx.message?.successful_payment.telegram_payment_charge_id,
      providerPaymentChargeId:
        ctx.message?.successful_payment.provider_payment_charge_id,
    });

    if (!user) {
      throw new Error(
        `User not found for telegramId: ${id}. TelegramTransaction saved: ${telegramTransaction._id}. telegram_payment_charge_id: ${ctx.message?.successful_payment.telegram_payment_charge_id}, provider_payment_charge_id: ${ctx.message?.successful_payment.provider_payment_charge_id}`,
      );
    }

    const packageKey = ctx.message?.successful_payment
      .invoice_payload as PackageName;
    const packageData = PACKAGES[packageKey];
    if (packageData.basicRequestsBalance) {
      user.basicRequestsBalance += packageData.basicRequestsBalance;
    }
    if (packageData.proRequestsBalance) {
      user.proRequestsBalance += packageData.proRequestsBalance;
    }
    if (packageData.imageGenerationBalance) {
      user.imageGenerationBalance += packageData.imageGenerationBalance;
    }
    user.updatedAt = new Date();
    await user.save();

    await ctx.reply(`Баланс успешно пополнен ✅`);
    await ctx.reply(getBalanceMessage(user), {
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    await ctx.reply(
      `Произошла ошибка при пополнении баланса. ${SUPPORT_MESSAGE_POSTFIX}`,
    );
    logError({
      message: 'Error in successful_payment callbackQuery',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};

// Deprecated: This function is no longer in use and may be removed in future versions.
export const createPaymentLink = async (
  ctx: CallbackQueryContext<MyContext>,
) => {
  await ctx.answerCallbackQuery();
  const { id } = ctx.from;

  try {
    const packageKey = ctx.callbackQuery.data as PackageName;
    if (!PACKAGES[packageKey]) {
      throw new Error(
        `${ctx.callbackQuery.data} | ${packageKey} is not in PACKAGES`,
      );
    }
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
          phone: '??????',
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
      message: 'Error in createPaymentLink callbackQuery',
      error,
      telegramId: ctx.from?.id,
      username: ctx.from?.username,
    });
  }
};
