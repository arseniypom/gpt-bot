import mongoose from 'mongoose';

const telegramTransactionSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  packageName: { type: String, required: true },
  telegramPaymentChargeId: { type: String, required: true },
  providerPaymentChargeId: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model('telegram_transaction', telegramTransactionSchema);
