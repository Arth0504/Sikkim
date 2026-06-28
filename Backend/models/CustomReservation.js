import mongoose from "mongoose";

const customReservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    budget: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    interests: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    aiGeneratedPlan: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    estimatedPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminRemarks: {
      type: String,
      default: "",
    },
    customPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CustomReservation", customReservationSchema);
