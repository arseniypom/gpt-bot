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

// Schedule the task to run every day at 21:00 UTC
cron.schedule('0 22 * * *', async () => {
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
      try {
        const {
          subscriptionLevel,
          yookassaPaymentMethodId,
          subscriptionDuration,
        } = user;

        const subscriptionData = SUBSCRIPTIONS[subscriptionLevel];
        const { title, price, description, icon } = subscriptionData;
        const amountObj = {
          value: `${price}.00`,
          currency: 'RUB',
        };

        if (!yookassaPaymentMethodId) {
          throw new Error(
            `yookassaPaymentMethodId is not set: ${yookassaPaymentMethodId}`,
          );
        }

        const createPayload: ICreatePayment = {
          amount: amountObj,
          capture: true,
          payment_method_id: yookassaPaymentMethodId,
          description,
        };

        const idempotenceKey = uuidv4();

        const paymentResponse = await yookassaService.createPayment(
          createPayload,
          idempotenceKey,
        );

        console.log('paymentResponse', paymentResponse);

        switch (paymentResponse.status) {
          case 'succeeded':
            await SubscriptionTransaction.create({
              telegramId: user.telegramId,
              totalAmount: price,
              subscriptionLevel: subscriptionLevel,
              yookassaPaymentId: paymentResponse.id,
              yookassaPaymentMethodId: yookassaPaymentMethodId,
              status: paymentResponse.status,
            });
            if (subscriptionDuration?.days) {
              user.subscriptionExpiry = dayjs()
                .add(subscriptionDuration.days, 'day')
                .toDate();
            }
            if (subscriptionDuration?.months) {
              user.subscriptionExpiry = dayjs()
                .add(subscriptionDuration.months, 'month')
                .toDate();
            }

            user.basicRequestsBalanceLeftToday += Number(
              subscriptionData.basicRequestsPerDay,
            );
            if (subscriptionData.proRequestsPerDay) {
              user.proRequestsBalanceLeftToday += Number(
                subscriptionData.proRequestsPerDay,
              );
            }
            if (subscriptionData.imageGenerationPerDay) {
              user.imageGenerationBalanceLeftToday += Number(
                subscriptionData.imageGenerationPerDay,
              );
            }
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
              subscriptionLevel: subscriptionLevel,
              yookassaPaymentId: paymentResponse.id,
              yookassaPaymentMethodId: yookassaPaymentMethodId,
              status: paymentResponse.status,
              cancellationDetails: {
                party: paymentResponse.cancellation_details?.party,
                reason: paymentResponse.cancellation_details?.reason,
              },
            });
            user.subscriptionLevel = SubscriptionLevels.FREE;
            user.subscriptionExpiry = null;
            user.basicRequestsBalanceLeftToday =
              SUBSCRIPTIONS.FREE.basicRequestsPerDay || 0;
            user.proRequestsBalanceLeftToday =
              SUBSCRIPTIONS.FREE.proRequestsPerDay || 0;
            user.imageGenerationBalanceLeftToday =
              SUBSCRIPTIONS.FREE.imageGenerationPerDay || 0;
            user.yookassaPaymentMethodId = null;

            user.updatedAt = new Date();
            await user.save();

            let paymentFailedMessage = `К сожалению, ваша подписка уровня ${title} не была продлена🙁.`;
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
            });
            break;
          default:
            break;
        }
      } catch (error) {
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
