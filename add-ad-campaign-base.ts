import 'dotenv/config';
import mongoose from 'mongoose';
import AdCampaign from './db/AdCampaign';

async function addAdCampaignToDB() {
  try {
    const mode = 'dev';

    await mongoose.connect(
      // @ts-ignore
      mode === 'dev'
        ? process.env.MONGO_DB_URI_DEV!
        : process.env.MONGO_DB_URI_PROD!,
    );
    console.log('Mongoose connected');

    const code = '01';

    await AdCampaign.create({
      name: 'Test',
      source: 'https://...',
      adCode: code,
      link: `${
        // @ts-ignore
        mode === 'dev' ? process.env.BOT_URL_DEV : process.env.BOT_URL_PROD
      }?start=ad_${code}`,
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
