import cron from 'node-cron';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import bot from '../../bot';
import User from '../../db/User';
import { logError } from '../utils/utilFunctions';
import { SubscriptionLevels } from '../types/types';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import { ICreatePayment } from '../types/yookassaTypes';
import yookassaService from '../utils/yookassaService';
import SubscriptionTransaction from '../../db/SubscriptionTransaction';
import { mainKeyboard } from '../commands/start';
import { isValidSubscriptionDuration } from '../types/typeguards';
import { profileAddSubscriptionKeyboard } from '../commands/myProfile';

// Schedule the task to run every day at 21:00 UTC
cron.schedule('0 21 * * *', async () => {
  console.log('Current time:', dayjs().format('HH:mm'));
  console.log('running subscription check cron job');

  try {
    const startOfDay = dayjs().startOf('day');
    const endOfDay = dayjs().endOf('day');

    const users = await User.find({
      subscriptionExpiry: {
        $gte: startOfDay.toDate(),
        $lte: endOfDay.toDate(),
      },
    });

    for (const user of users) {
      const { subscriptionDuration } = user;
      if (!isValidSubscriptionDuration(subscriptionDuration)) {
        throw new Error(
          `telegramId: ${user.telegramId} userName: @${user.userName} subscriptionDuration is invalid or not set: ${subscriptionDuration}`,
        );
      }

      const newSubscriptionLevel =
        user.newSubscriptionLevel || user.subscriptionLevel;
      const subscriptionData = SUBSCRIPTIONS[newSubscriptionLevel];

      const { title, price, description, icon } = subscriptionData;
      const amountObj = {
        value: `${price}.00`,
        currency: 'RUB',
      };

      if (newSubscriptionLevel === SubscriptionLevels.FREE) {
        user.subscriptionLevel = SubscriptionLevels.FREE;
        user.subscriptionExpiry = null;
        if (SUBSCRIPTIONS.FREE.basicRequestsPerWeek) {
          user.basicRequestsLeftThisWeek =
            SUBSCRIPTIONS.FREE.basicRequestsPerWeek;
          user.weeklyRequestsExpiry = dayjs().add(7, 'day').toDate();
        }
        user.basicRequestsLeftToday = 0;
        user.proRequestsLeftThisMonths = 0;
        user.imageGenerationLeftThisMonths = 0;
        user.yookassaPaymentMethodId = null;

        user.subscriptionDuration = null;
        user.newSubscriptionLevel = null;
        user.lastUnsubscribeDate = new Date();
        user.updatedAt = new Date();
        await user.save();
        await bot.api.sendMessage(
          user.telegramId,
          `*Срок действия Вашей подписки закончился, и Вы были переключены на уровень \\"${icon}${SUBSCRIPTIONS.FREE.title}\\"*\n\nБлагодарим за использование нашего бота и надеемся увидеть Вас в числе подписчиков снова\\!`,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: profileAddSubscriptionKeyboard,
          },
        );
        continue;
      }

      if (!user.yookassaPaymentMethodId) {
        throw new Error(
          `yookassaPaymentMethodId is not set: ${user.yookassaPaymentMethodId}`,
        );
      }

      try {
        const createPayload: ICreatePayment = {
          amount: amountObj,
          capture: true,
          payment_method_id: user.yookassaPaymentMethodId,
          description,
        };

        const idempotenceKey = uuidv4();

        const paymentResponse = await yookassaService.createPayment(
          createPayload,
          idempotenceKey,
        );

        switch (paymentResponse.status) {
          case 'succeeded':
            await SubscriptionTransaction.create({
              telegramId: user.telegramId,
              totalAmount: price,
              subscriptionLevel: newSubscriptionLevel,
              yookassaPaymentId: paymentResponse.id,
              yookassaPaymentMethodId: user.yookassaPaymentMethodId,
              status: paymentResponse.status,
            });
            if (subscriptionDuration.days) {
              user.subscriptionExpiry = dayjs()
                .add(subscriptionDuration.days, 'day')
                .toDate();
            }
            if (subscriptionDuration.months) {
              user.subscriptionExpiry = dayjs()
                .add(subscriptionDuration.months, 'month')
                .toDate();
            }

            if (subscriptionData.basicRequestsPerDay) {
              user.basicRequestsLeftToday =
                subscriptionData.basicRequestsPerDay || 0;
            }
            if (subscriptionData.proRequestsPerMonth) {
              user.proRequestsLeftThisMonths =
                subscriptionData.proRequestsPerMonth || 0;
            }
            if (subscriptionData.imageGenerationPerMonth) {
              user.imageGenerationLeftThisMonths =
                subscriptionData.imageGenerationPerMonth || 0;
            }
            user.newSubscriptionLevel = null;
            user.updatedAt = new Date();
            await user.save();
            await bot.api.sendMessage(
              user.telegramId,
              `*Ваша подписка уровня \\"${title}\\" успешно продлена ${icon} *\n\nПриятного использования\\!`,
              {
                parse_mode: 'MarkdownV2',
              },
            );
            break;
          case 'canceled':
            await SubscriptionTransaction.create({
              telegramId: user.telegramId,
              totalAmount: price,
              subscriptionLevel: newSubscriptionLevel,
              yookassaPaymentId: paymentResponse.id,
              yookassaPaymentMethodId: user.yookassaPaymentMethodId,
              status: paymentResponse.status,
              cancellationDetails: {
                party: paymentResponse.cancellation_details?.party,
                reason: paymentResponse.cancellation_details?.reason,
              },
            });
            user.subscriptionLevel = SubscriptionLevels.FREE;
            user.newSubscriptionLevel = null;

            user.subscriptionExpiry = null;
            user.basicRequestsLeftToday =
              SUBSCRIPTIONS.FREE.basicRequestsPerDay || 0;
            user.proRequestsLeftThisMonths =
              SUBSCRIPTIONS.FREE.proRequestsPerMonth || 0;
            user.imageGenerationLeftThisMonths =
              SUBSCRIPTIONS.FREE.imageGenerationPerMonth || 0;
            user.yookassaPaymentMethodId = null;

            user.updatedAt = new Date();
            await user.save();

            let paymentFailedMessage = `К сожалению, ваша подписка уровня ${title} не была продлена 🙁`;
            if (
              paymentResponse.cancellation_details?.reason ===
              'insufficient_funds'
            ) {
              paymentFailedMessage += `\n\nПричина: Недостаточно средств на карте\nПожалуйста, проверьте баланс карты и попробуйте снова /subscription`;
            } else {
              paymentFailedMessage += `\n\nПожалуйста, попробуйте снова: /subscription`;
            }

            await bot.api.sendMessage(user.telegramId, paymentFailedMessage, {
              parse_mode: 'MarkdownV2',
              reply_markup: mainKeyboard,
            });
            break;
          default:
            break;
        }
      } catch (error) {
        await bot.api.sendMessage(
          user.telegramId,
          `Не смогли продлить вашу подписку 🙁\n\nПожалуйста, проверьте платежные данные ипопробуйте оформить её ещё раз /subscription или обратитесь в поддержку /support`,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: mainKeyboard,
          },
        );
        logError({
          message: 'Failed to renew subscription',
          error,
          telegramId: user.telegramId,
          username: user.userName,
        });
      }
    }
  } catch (error) {
    logError({
      message: 'Error in subscription expiry check cron job',
      error,
    });
  }
});
