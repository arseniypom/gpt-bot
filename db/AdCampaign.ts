import mongoose from 'mongoose';

const adCampaignStatsSchema = new mongoose.Schema({
  registeredUsers: { type: Number, default: 0 },
  tokensBought: { type: Number, default: 0 },
  trialsBought: { type: Number, default: 0 },
  subsBought: { type: Number, default: 0 },
});

const adCampaignSchema = new mongoose.Schema({
  source: { type: String, required: true },
  adCode: { type: String, unique: true, required: true },
  text: { type: String, default: '' },
  stats: { type: adCampaignStatsSchema, default: () => ({}) },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model('ad_campaign', adCampaignSchema);
