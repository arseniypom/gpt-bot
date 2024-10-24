import mongoose, { Document, Schema } from 'mongoose';

export interface MessageDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const messageSchema = new Schema<MessageDocument>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model<MessageDocument>('Message', messageSchema);
