import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'NEW_USER',
        'NEW_BOOKING',
        'NEW_QUERY',
        'NEW_REVIEW',
        'CANCELLATION_REQUEST',
        'REFUND_REQUEST',
        'FESTIVAL_REMINDER',
        'CUSTOM_RESERVATION',
        'SYSTEM',
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    referenceId: {
      type: String,
      default: "",
    },
    actionUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
