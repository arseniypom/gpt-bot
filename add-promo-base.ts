import 'dotenv/config';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import Promocode from './db/Promocode';

async function addPromocodeToDB() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI_PROD!);
    console.log('Mongoose connected');

    await Promocode.create({
      code: 'TEST',
      tokenAmount: 50,
      timesUsedLimit: 1,
      validUntil: dayjs(),
    });

    console.log('Promocode added successfully');
  } catch (error) {
    console.error('Error adding promocode:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Mongoose disconnected');
  }
}

addPromocodeToDB();

