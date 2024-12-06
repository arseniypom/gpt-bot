import mongoose from 'mongoose';

const adCampaignSchema = new mongoose.Schema({
  source: { type: String, required: true },
  adCode: { type: String, unique: true, required: true },
  text: { type: String, default: '' },
  stats: {
    type: Object,
    default: {
      registeredUsers: 0,
      tokensBought: 0,
      trialsBought: 0,
      subsBought: 0,
    },
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model('ad_campaign', adCampaignSchema);
