import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, unique: true },
  firstName: String,
  userName: String,
  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
  history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
});

export default mongoose.model('Users', userSchema);
