import mongoose from 'mongoose';
import { AiModels } from '../types/types';

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, unique: true },
  firstName: String,
  userName: String,
  selectedModel: {
    type: String,
    default: AiModels.GPT_3_5_TURBO,
  },
  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model('User', userSchema);
