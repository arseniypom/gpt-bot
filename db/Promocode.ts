import mongoose from 'mongoose';

const promocodeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  validUntil: { type: Date },
  timesUsed: { type: Number, default: 0 },
  timesUsedLimit: { type: Number },
  tokenAmount: { type: Number },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model('promocode', promocodeSchema);
