import mongoose, { Schema } from 'mongoose';
import { AiModelLabel, ChatMode } from '../src/types/types';

export interface IMessage {
  chatId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'system' | 'user' | 'assistant';
  content: string;
  voiceFileId?: string;
  model?: AiModelLabel;
  chatMode?: ChatMode;
  createdAt: Date;
  imageData?: Buffer;
}

const messageSchema = new Schema<IMessage>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  voiceFileId: { type: String },
  model: { type: String },
  chatMode: { type: String },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
  imageData: { type: Buffer },
});

export default mongoose.model<IMessage>('message', messageSchema);
