import cron from 'node-cron';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { Document, Types } from 'mongoose';
import bot from '../../bot';
import User, { IUser } from '../../db/User';
import { logError, setUserBlocked } from '../utils/utilFunctions';
import { SubscriptionLevels } from '../types/types';
import { SUBSCRIPTIONS } from '../bot-subscriptions';
import { ICreatePayment } from '../types/yookassaTypes';
import yookassaService from '../utils/yookassaService';
import SubscriptionTransaction from '../../db/SubscriptionTransaction';
import { mainKeyboard } from '../commands/start';
import { isValidSubscriptionDuration } from '../types/typeguards';
import { GrammyError } from 'grammy';
import AdCampaign from '../../db/AdCampaign';

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
      const newSubscriptionLevel =
        user.newSubscriptionLevel || user.subscriptionLevel;
      const subscriptionData = SUBSCRIPTIONS[newSubscriptionLevel];
      const subscriptionDuration = subscriptionData.duration;

      const { title, price, description, icon } = subscriptionData;
      const amountObj = {
        value: `${price}.00`,
        currency: 'RUB',
      };

      if (newSubscriptionLevel === SubscriptionLevels.FREE) {
        const downgradedUser = await downgradeSubscription(user);
        await downgradedUser.save();
        await bot.api.sendMessage(
          user.telegramId,
          `*Срок действия Вашей подписки закончился, и Вы были переключены на уровень \\"${icon}${SUBSCRIPTIONS.FREE.title}\\"*\n\nБлагодарим за использование нашего бота\\! Вы можете возобновить подписку в любой момент, воспользовавшись командой\n/subscription, или купить токены 🪙: /profile\\.\n\nP\\.S\\. А ещё можно получить запросы бесплатно через реферальную программу /profile\\!`,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: mainKeyboard,
          },
        );
        continue;
      }

      if (!user.yookassaPaymentMethodId) {
        throw new Error(
          `yookassaPaymentMethodId is not set: ${user.yookassaPaymentMethodId}`,
        );
      }

      if (!isValidSubscriptionDuration(subscriptionDuration)) {
        throw new Error(
          `telegramId: ${user.telegramId} userName: @${user.userName} subscriptionDuration for ${newSubscriptionLevel} is invalid or not set: ${subscriptionDuration}`,
        );
      }

      if (!user.email) {
        throw new Error(
          `telegramId: ${user.telegramId} userName: @${user.userName} email is not set`,
        );
      }

      try {
        const createPayload: ICreatePayment = {
          amount: amountObj,
          capture: true,
          payment_method_id: user.yookassaPaymentMethodId,
          description,
          receipt: {
            customer: {
              email: user.email,
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
              email: user.email || '',
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
            // Check if user has ad campaign code and update its stats
            if (user.adCampaignCode) {
              const adCampaign = await AdCampaign.findOne({
                adCode: user.adCampaignCode,
              });
              if (adCampaign) {
                adCampaign.stats.subsBought += 1;
                await adCampaign.save();
              }
            }
            if (subscriptionData.basicRequestsPerDay) {
              user.basicRequestsLeftToday =
                subscriptionData.basicRequestsPerDay || 0;
            }
            if (subscriptionData.proRequestsPerMonth) {
              user.proRequestsLeftThisMonth =
                subscriptionData.proRequestsPerMonth || 0;
            }
            if (subscriptionData.imageGenerationPerMonth) {
              user.imageGenerationLeftThisMonth =
                subscriptionData.imageGenerationPerMonth || 0;
            }
            user.subscriptionLevel = newSubscriptionLevel;
            user.subscriptionDuration = subscriptionDuration;
            user.newSubscriptionLevel = null;
            user.updatedAt = new Date();
            await user.save();
            await bot.api.sendMessage(
              user.telegramId,
              `*Ваша подписка уровня\n\\"${icon} ${title}\\" успешно продлена ✔️ *\n\nПриятного использования\\!`,
              {
                parse_mode: 'MarkdownV2',
              },
            );
            break;
          case 'canceled':
            await SubscriptionTransaction.create({
              telegramId: user.telegramId,
              email: user.email || '',
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
            user.subscriptionExpiry = null;
            if (SUBSCRIPTIONS.FREE.basicRequestsPerWeek) {
              user.basicRequestsLeftThisWeek =
                SUBSCRIPTIONS.FREE.basicRequestsPerWeek;
              user.weeklyRequestsExpiry = dayjs().add(7, 'day').toDate();
            }
            user.basicRequestsLeftToday = 0;
            user.proRequestsLeftThisMonth = 0;
            user.imageGenerationLeftThisMonth = 0;
            user.yookassaPaymentMethodId = null;

            user.subscriptionDuration = null;
            user.newSubscriptionLevel = null;
            user.lastUnsubscribeDate = new Date();
            user.unsubscribeReason =
              paymentResponse.cancellation_details?.reason;
            user.updatedAt = new Date();
            await user.save();

            let paymentFailedMessage = `*К сожалению, ваша подписка уровня ${title} не была продлена 🙁*`;
            if (
              paymentResponse.cancellation_details?.reason ===
              'insufficient_funds'
            ) {
              paymentFailedMessage += `\n\nПричина: Недостаточно средств на карте\nПожалуйста, проверьте баланс и попробуйте снова /subscription`;
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
        const downgradedUser = await downgradeSubscription(user);
        await downgradedUser.save();
        try {
          await bot.api.sendMessage(
            user.telegramId,
            `Не смогли продлить вашу подписку 🙁\n\nПожалуйста, проверьте платежные данные ипопробуйте оформить её ещё раз /subscription или обратитесь в поддержку /support`,
            {
              parse_mode: 'MarkdownV2',
              reply_markup: mainKeyboard,
            },
          );
        } catch (error) {
          if (
            error instanceof GrammyError &&
            error.error_code === 403 &&
            /block/.test(error.description)
          ) {
            await setUserBlocked(error.payload.chat_id as number);
          }
        }
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

const downgradeSubscription = async (
  user: Document<unknown, {}, IUser> &
    IUser & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    },
) => {
  user.subscriptionLevel = SubscriptionLevels.FREE;
  user.subscriptionExpiry = null;
  if (SUBSCRIPTIONS.FREE.basicRequestsPerWeek) {
    user.basicRequestsLeftThisWeek = SUBSCRIPTIONS.FREE.basicRequestsPerWeek;
    user.weeklyRequestsExpiry = dayjs().add(7, 'day').toDate();
  }
  user.basicRequestsLeftToday = 0;
  user.proRequestsLeftThisMonth = 0;
  user.imageGenerationLeftThisMonth = 0;
  user.yookassaPaymentMethodId = null;

  user.subscriptionDuration = null;
  user.newSubscriptionLevel = null;
  user.lastUnsubscribeDate = new Date();
  user.updatedAt = new Date();

  return user;
};
