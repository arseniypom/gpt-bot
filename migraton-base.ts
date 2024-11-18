import 'dotenv/config';
import mongoose from 'mongoose';

async function migrateDB() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI_DEV!);

    // Update data

    console.log('Users updated successfully');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateDB();
