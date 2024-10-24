import { CallbackQueryContext, InlineKeyboard } from 'grammy';
import { ICreatePayment } from '@a2seven/yoo-checkout';
import { v4 as uuidv4 } from 'uuid';
import bot, { checkout } from '../../bot';
import { PACKAGES } from '../bot-packages';
import {
  getYookassaPaymentProviderToken,
  logError,
} from '../utils/utilFunctions';
import { MyContext, PackageName } from '../types/types';
import User from '../../db/User';
import TelegramTransaction from '../../db/TelegramTransaction';
import { getBalanceMessage } from './consts';

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

    await ctx.reply(
      '*💳 Для оплаты нажмите кнопку "оплатить" ниже*\n\n_🔐 Платеж будет безопасно проведен через платежную систему [Юкасса](https://yookassa.ru)\n__бот не имеет доступа к Вашим платежным данным и нигде не сохраняет их___',
      {
        parse_mode: 'MarkdownV2',
        link_preview_options: {
          is_disabled: true,
        },
      },
    );

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
      'Произошла ошибка при пополнении баланса. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in topup callbackQuery:', error);
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

    await user.save();

    await ctx.reply(`Баланс успешно пополнен ✅`);
    await ctx.reply(getBalanceMessage(user), {
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при пополнении баланса. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in successful_payment callbackQuery:', error);
  }
};

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

    const createPayload: ICreatePayment = {
      amount: {
        value: `${packageData.price}.00`,
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: 'https://gpt-bot-frontend.vercel.app/',
      },
      capture: true,
      description: packageData.description,
      metadata: {
        telegramId: id,
        packageName: packageKey,
        basicRequestsBalance: packageData.basicRequestsBalance,
        proRequestsBalance: packageData.proRequestsBalance,
        imageGenerationBalance: packageData.imageGenerationBalance,
      },
    };

    const paymentObj = await checkout.createPayment(
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

    await ctx.reply(
      '*💳 Для оплаты нажмите кнопку "Оплатить" ниже*\n\n_🔐 Вы будете перенаправлены на страницу платежной системы Юкасса\n__Платеж будет безопасно проведен на стороне Юкасса, бот не имеет доступа к Вашим платежным данным и нигде их не сохраняет___',
      {
        parse_mode: 'MarkdownV2',
        reply_markup: paymentKeyboard,
      },
    );
  } catch (error) {
    await ctx.reply(
      'Произошла ошибка при создании ссылки для оплаты. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
    );
    logError('Error in createPaymentLink callbackQuery:', error);
  }
};
