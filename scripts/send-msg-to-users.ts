import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../db/User';
import fs from 'fs';
import axios from 'axios';
import { SubscriptionLevels } from '../src/types/types';
import { BUTTON_LABELS } from '../src/utils/consts';
import FormData from 'form-data';
import pLimit from 'p-limit';

export async function sendMessageToAllUsers() {
  const botApiKey = process.env.BOT_API_KEY_DEV;

  await mongoose.connect(process.env.MONGO_DB_URI_DEV!);
  console.log('Mongoose connected');

  const users = await User.find({ isBlockedBot: false });

  console.log(users.length);
  
  const limit = pLimit(10);
  let sentMessages = 0;

  const sendPhotoPromises = users.map((user) => {
    return limit(async () => {
      if (user.telegramId === Number(process.env.ADMIN_TELEGRAM_ID)) {
        const form = new FormData();
        form.append('chat_id', user.telegramId);
        form.append('photo', fs.createReadStream('img1.webp'));
        form.append(
          'caption',
          `*Увеличиваем лимиты\\. Цена – остаётся\\.*\n\nНекоторые лимиты запросов удвоили, другие – утроили, а третьи\\.\\.\\. сделали *безлимитными* 🫢\n\nА также:\n>>>⋅ Добавили новую думающую модель o1, которая доступна во всех уровнях подписки\n>>>⋅ Добавили выбор роли: в роли “Переводчик” бот переводит с любого языка на любой, сохраняя контекст, эмоции и все остальные нюансы\n>>>⋅ Сделали доступным “общение с фотографиями”: загружаете фото и задаете вопросы, контекст сохраняется\n\n*Забирайте пробную подписку всего за 1 рубль и протестуйте обновления сами\\! 🔥*`,
        );
        form.append('parse_mode', 'MarkdownV2');

        if (user.subscriptionLevel === SubscriptionLevels.FREE) {
          let keyboard;
          if (user.canActivateTrial) {
            keyboard = [
              [
                {
                  text: '🔥 3 дня за 1 рубль',
                  callback_data: `${SubscriptionLevels.OPTIMUM_TRIAL}-no-delete`,
                },
              ],
            ];
          } else {
            keyboard = [
              [
                {
                  text: BUTTON_LABELS.subscribe,
                  callback_data: 'subscription',
                },
              ],
            ];
          }

          form.append(
            'reply_markup',
            JSON.stringify({
              inline_keyboard: keyboard,
            }),
          );
        }

        try {
          await axios.post(
            `https://api.telegram.org/bot${botApiKey}/sendPhoto`,
            form,
            {
              headers: {
                ...form.getHeaders(),
              },
            },
          );
          sentMessages++;
        } catch (error) {
          console.error(
            `Error sending message to user ${user.telegramId}:`,
            // @ts-ignore
            error.response ? error.response.data : error.message,
          );
        }
      }
    });
  });

  await Promise.all(sendPhotoPromises);

  console.log(`Sent ${sentMessages} messages`);
  await mongoose.disconnect();
  console.log('Mongoose disconnected');
}
