import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  role: String,
  content: String,
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model('Message', messageSchema);