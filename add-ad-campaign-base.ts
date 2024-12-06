import 'dotenv/config';
import mongoose from 'mongoose';
import AdCampaign from './db/AdCampaign';

async function addAdCampaignToDB() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI_DEV!);
    console.log('Mongoose connected');

    await AdCampaign.create({
      source: 'https://t.me/real_education_family',
      adCode: '1',
    });

    console.log('Ad campaign added successfully');
  } catch (error) {
    console.error('Error adding ad campaign:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Mongoose disconnected');
  }
}

addAdCampaignToDB();

