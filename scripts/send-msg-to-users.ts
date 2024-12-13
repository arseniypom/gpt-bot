import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../db/User';
import fs from 'fs';
import axios from 'axios';

export async function sendMessageToAllUsers() {
  const botApiKey = process.env.BOT_API_KEY_DEV;

  try {
    await mongoose.connect(process.env.MONGO_DB_URI_DEV!);
    console.log('Mongoose connected');

    const users = await User.find({ isBlockedBot: false });

    let sentMessages = 0;
    for (const user of users) {
      user.tokensBalance += 30;
      await user.save();

      const photoStream = fs.createReadStream('img.webp');
      const headers = {
        'Content-Type': 'multipart/form-data',
      };
      const caption = `*🗣️ Обновление – голосовые сообщения\\!*\n\nТеперь Вы можете отправлять боту голосовые вместо долгого набора текстового сообщения\\! Попробуйте – дарим 30 токенов на баланс 😎\n\nВаш обновленный баланс: ${user.tokensBalance} 🪙`;

      await axios.post(
        `https://api.telegram.org/bot${botApiKey}/sendPhoto`,
        {
          chat_id: user.telegramId,
          photo: photoStream,
          caption,
          parse_mode: 'MarkdownV2',
        },
        { headers },
      );

      sentMessages++;
    }
    console.log(`Sent ${sentMessages} messages`);
  } catch (error) {
    console.error('Error sending messages to users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Mongoose disconnected');
  }
}
