import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,

    amount: Number,

    status: {
      type: String,
      enum: ["created", "success", "failed", "refunded"],
      default: "created",
    },

    refundId: String,

    refundStatus: {
      type: String,
      enum: ["none", "pending", "processed", "failed", "refunded"],
      default: "none",
    },

    refundAmount: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);