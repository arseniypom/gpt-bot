import mongoose, { Schema } from 'mongoose';
import { AiModelLabel, AssistantRole, ChatMode } from '../src/types/types';

export interface IMessage {
  chatId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'system' | 'user' | 'assistant';
  assistantRole: AssistantRole;
  content?: string;
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
  assistantRole: { type: String },
  content: { type: String },
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
