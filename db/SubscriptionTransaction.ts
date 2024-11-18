import { Schema, model } from 'mongoose';
import { CancellationDetails, SubscriptionLevel } from '../src/types/types';

export interface SubscriptionTransaction {
  telegramId: number;
  email: string;
  totalAmount: number;
  subscriptionLevel: SubscriptionLevel;
  yookassaPaymentId: string;
  yookassaPaymentMethodId: string;
  cancellationDetails?: CancellationDetails;
  status: string;
  createdAt: Date;
}

const subscriptionTransactionSchema: Schema<SubscriptionTransaction> =
  new Schema({
    telegramId: { type: Number, required: true },
    email: { type: String },
    totalAmount: { type: Number },
    subscriptionLevel: { type: String, required: true },
    yookassaPaymentId: { type: String, required: true },
    yookassaPaymentMethodId: { type: String, required: true },
    cancellationDetails: { type: Object },
    status: { type: String, required: true },
    createdAt: {
      type: Date,
      default: () => Date.now(),
    },
  });

export default model<SubscriptionTransaction>(
  'subscription_transaction',
  subscriptionTransactionSchema,
);
