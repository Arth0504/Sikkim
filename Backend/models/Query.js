import mongoose from "mongoose";

const querySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: String, unique: true },
    acknowledgementEmailStatus: {
      type: String,
      enum: ["PENDING", "DELIVERED", "FAILED"],
      default: "PENDING",
    },
    acknowledgementEmailSentAt: { type: Date },
    isAdminRead: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"],
      default: "NEW",
    },
    adminReply: { type: String, default: "" },
    replies: [
      {
        message: { type: String, required: true },
        sender: { type: String, default: "Admin" },
        sentAt: { type: Date, default: Date.now },
        emailStatus: {
          type: String,
          enum: ["DELIVERED", "FAILED"],
          default: "DELIVERED",
        },
      },
    ],
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Query", querySchema);
