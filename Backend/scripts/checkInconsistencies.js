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

    // Find all bookings with paymentStatus = "refunded"
    const refundedBookings = await Booking.find({
      paymentStatus: "refunded"
    });

    console.log(`Found ${refundedBookings.length} bookings with paymentStatus = "refunded":`);
    refundedBookings.forEach((b) => {
      console.log(`- Booking ID: ${b._id}, customer: ${b.firstName} ${b.lastName}, refund_status: ${b.refund_status}, cancelStatus: ${b.cancelStatus}, paymentStatus: ${b.paymentStatus}`);
    });

    // Find all payments with status = "refunded"
    const refundedPayments = await Payment.find({
      status: "refunded"
    });

    console.log(`\nFound ${refundedPayments.length} payments with status = "refunded":`);
    refundedPayments.forEach((p) => {
      console.log(`- Payment ID: ${p._id}, booking: ${p.booking}, refundStatus: ${p.refundStatus}, status: ${p.status}`);
    });

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

runCheck();
