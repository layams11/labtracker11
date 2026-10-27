import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    instrumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instrument',
      required: [true, 'Instrument reference is required'],
    },
    date: {
      type: String,
      required: [true, 'Date is required (YYYY-MM-DD)'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Confirmed', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Confirmed',
    },
    actualStartTime: {
      type: Date,
      default: null,
    },
    actualEndTime: {
      type: Date,
      default: null,
    },
    actualUsageDuration: {
      type: Number, // stored in minutes
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking =
  mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
