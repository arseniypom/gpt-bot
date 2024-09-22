import mongoose from 'mongoose';
import { DEFAULT_AI_MODEL } from '../src/utils/consts';

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, unique: true },
  firstName: String,
  userName: String,
  selectedModel: {
    type: String,
    default: DEFAULT_AI_MODEL,
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
