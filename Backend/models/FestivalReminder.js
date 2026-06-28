import mongoose from 'mongoose';

const festivalReminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    festival: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Festival",
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    reminderDays: {
      type: [Number],
      default: [7, 3, 1], // default reminders to trigger
    },
    subscribed: {
      type: Boolean,
      default: true,
    },
    sentReminders: {
      type: [Number],
      default: [], // tracks already sent reminders (e.g. [7] means 7-day reminder was sent)
    },
  },
  { timestamps: true }
);

// Enforce unique subscription per user per festival
festivalReminderSchema.index({ user: 1, festival: 1 }, { unique: true });

export default mongoose.model("FestivalReminder", festivalReminderSchema);
