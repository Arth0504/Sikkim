import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceType: {
      type: String,
      enum: ["booking_confirmation", "cancellation", "refund"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    sentTo: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },
    error: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
