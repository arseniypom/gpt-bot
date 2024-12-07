import 'dotenv/config';
import mongoose from 'mongoose';
import AdCampaign from './db/AdCampaign';

async function addAdCampaignToDB() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI_DEV!);
    console.log('Mongoose connected');

    const code = '01';

    await AdCampaign.create({
      name: 'Miro',
      source: 'https://...',
      adCode: code,
      link: `${process.env.BOT_URL_DEV}?start=ad_${code}`,
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
