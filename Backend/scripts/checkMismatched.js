import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

dotenv.config();

const runCheck = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully.");

    // Mismatched processed bookings
    const mismatchedBookings = await Booking.find({
      refund_status: "processed",
      paymentStatus: { $ne: "refunded" }
    });

    console.log(`Found ${mismatchedBookings.length} bookings where refund_status = "processed" but paymentStatus != "refunded":`);
    mismatchedBookings.forEach((b) => {
      console.log(`- Booking ID: ${b._id}, customer: ${b.firstName} ${b.lastName}, refund_status: ${b.refund_status}, paymentStatus: ${b.paymentStatus}`);
    });

    // Mismatched pending bookings
    const mismatchedPending = await Booking.find({
      refund_status: "pending",
      paymentStatus: "refunded"
    });

    console.log(`\nFound ${mismatchedPending.length} bookings where refund_status = "pending" but paymentStatus = "refunded":`);
    mismatchedPending.forEach((b) => {
      console.log(`- Booking ID: ${b._id}, customer: ${b.firstName} ${b.lastName}, refund_status: ${b.refund_status}, paymentStatus: ${b.paymentStatus}`);
    });

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

runCheck();
