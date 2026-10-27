import mongoose from 'mongoose';

// Instrument Schema
const instrumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Instrument name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Maintenance'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);

export const Instrument =
  mongoose.models.Instrument || mongoose.model('Instrument', instrumentSchema);
export default Instrument;
