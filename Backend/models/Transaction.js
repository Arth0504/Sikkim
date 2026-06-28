import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    packageName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    refundId: {
      type: String,
      default: null,
    },
    transactionStatus: {
      type: String,
      enum: [
        "PAYMENT_SUCCESS",
        "CANCELLATION_REQUESTED",
        "CANCELLATION_APPROVED",
        "REFUND_PENDING",
        "REFUND_PROCESSED",
        "REFUND_FAILED",
        "BOOKING_CANCELLED",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
