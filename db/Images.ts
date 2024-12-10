import mongoose, { Schema } from 'mongoose';

const imagesSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: String },
  prompt: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model('images', imagesSchema);
