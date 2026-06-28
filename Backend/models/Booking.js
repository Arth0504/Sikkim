import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    // USER DETAILS
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
      min: 13,
      max: 80,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    idProofType: {
      type: String,
      enum: ["Aadhaar", "PAN", "Passport", "VoterID", "DrivingLicense"],
      default: "Aadhaar",
    },

    idProofNumber: {
      type: String,
      required: true,
      trim: true,
    },

    passportPhoto: {
      type: String,
      default: "",
    },

    travellers: [
      {
        name: { type: String, required: true },
        age: { type: Number, required: true },
      },
    ],

    travelStartDate: {
      type: Date,
      required: true,
    },

    persons: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    specialRequest: {
      type: String,
      default: "",
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["online", "cash"],
      default: "online",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },

    paymentId: {
      type: String,
      default: null,
    },

    orderId: {
      type: String,
      default: null,
    },

    razorpay_order_id: {
      type: String,
      default: null,
    },

    razorpay_payment_id: {
      type: String,
      default: null,
    },

    paymentAmount: {
      type: Number,
      default: null,
    },

    refund_id: {
      type: String,
      default: null,
    },

    refund_amount: {
      type: Number,
      default: null,
    },

    refund_status: {
      type: String,
      default: null,
    },

    refunded_at: {
      type: Date,
      default: null,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    blockedReason: {
      type: String,
      default: "",
    },

    cancelStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },

    cancelReason: {
      type: String,
      default: "",
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationRequestedAt: {
      type: Date,
      default: null,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    invoiceSent: {
      type: Boolean,
      default: false,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);