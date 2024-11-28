import 'dotenv/config';
import mongoose from 'mongoose';
import User from './db/User';

export async function migrateDB() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI_DEV!);
    console.log('Mongoose connected');

    const users = await User.find({});
    let count = 0;
    for (const user of users) {
      const { basicReqsMade, proReqsMade, imgGensMade } = user;
      user.stats = {
        basicReqsMade,
        proReqsMade,
        imgGensMade,
      };

      // Remove old fields
      // @ts-ignore
      user.basicReqsMade = undefined;
      // @ts-ignore
      user.proReqsMade = undefined;
      // @ts-ignore
      user.imgGensMade = undefined;

      await user.save();
      count++;
    }

    console.log(`Users updated successfully: ${count}`);
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Mongoose disconnected');
  }
}