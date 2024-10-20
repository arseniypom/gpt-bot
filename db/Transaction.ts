import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalAmount: { type: Number, required: true },
  packageName: { type: String, required: true },
  telegramPaymentChargeId: { type: String, required: true },
  providerPaymentChargeId: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model('Transaction', transactionSchema);
