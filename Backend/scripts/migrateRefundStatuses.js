import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

dotenv.config();

const runMigration = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully.\n");

    // ==========================================
    // 1. BEFORE FIX REPORT
    // ==========================================
    console.log("=== BEFORE FIX REPORT ===");
    
    // Inconsistent: paymentStatus = REFUNDED, refundStatus = PENDING
    const inconsistentBookingsBefore = await Booking.find({
      paymentStatus: "refunded",
      refund_status: "pending"
    });
    console.log(`- Bookings (paymentStatus='refunded' && refund_status='pending'): ${inconsistentBookingsBefore.length}`);
    
    const inconsistentPaymentsBefore = await Payment.find({
      status: "refunded",
      refundStatus: "pending"
    });
    console.log(`- Payments (status='refunded' && refundStatus='pending'): ${inconsistentPaymentsBefore.length}`);

    // Inconsistent: refundStatus = PROCESSED, paymentStatus != REFUNDED
    const processedMismatchesBefore = await Booking.find({
      refund_status: "processed",
      paymentStatus: { $ne: "refunded" }
    });
    console.log(`- Bookings (refund_status='processed' && paymentStatus!='refunded'): ${processedMismatchesBefore.length}`);

    // Inconsistent: refundStatus = FAILED, paymentStatus = REFUNDED
    const failedMismatchesBefore = await Booking.find({
      refund_status: "failed",
      paymentStatus: "refunded"
    });
    console.log(`- Bookings (refund_status='failed' && paymentStatus='refunded'): ${failedMismatchesBefore.length}`);

    // ==========================================
    // 2. RUN MIGRATIONS
    // ==========================================
    console.log("\n=== RUNNING MIGRATIONS ===");

    // Migration A: paymentStatus = REFUNDED & refundStatus = PENDING -> paymentStatus = SUCCESS (paid) & refundStatus = PENDING
    let fixCountA = 0;
    for (const booking of inconsistentBookingsBefore) {
      booking.paymentStatus = "paid"; // SUCCESS equivalent for bookings
      await booking.save();
      
      const payment = await Payment.findOne({ booking: booking._id });
      if (payment) {
        payment.status = "success"; // SUCCESS equivalent for payments
        payment.refundStatus = "pending";
        await payment.save();
      }
      console.log(`Migrated booking ${booking._id} to paymentStatus='paid', refund_status='pending'`);
      fixCountA++;
    }

    for (const payment of inconsistentPaymentsBefore) {
      payment.status = "success";
      payment.refundStatus = "pending";
      await payment.save();
      
      const booking = await Booking.findById(payment.booking);
      if (booking) {
        booking.paymentStatus = "paid";
        booking.refund_status = "pending";
        await booking.save();
      }
      console.log(`Migrated payment ${payment._id} to status='success', refundStatus='pending'`);
      fixCountA++;
    }

    // Migration B: refund_status = PROCESSED & paymentStatus != REFUNDED -> paymentStatus = REFUNDED
    let fixCountB = 0;
    for (const booking of processedMismatchesBefore) {
      booking.paymentStatus = "refunded";
      await booking.save();

      const payment = await Payment.findOne({ booking: booking._id });
      if (payment) {
        payment.status = "refunded";
        payment.refundStatus = "refunded";
        await payment.save();
      }
      console.log(`Migrated booking ${booking._id} to paymentStatus='refunded' (refund processed)`);
      fixCountB++;
    }

    // Migration C: refund_status = FAILED & paymentStatus = REFUNDED -> paymentStatus = SUCCESS (paid)
    let fixCountC = 0;
    for (const booking of failedMismatchesBefore) {
      booking.paymentStatus = "paid";
      await booking.save();

      const payment = await Payment.findOne({ booking: booking._id });
      if (payment) {
        payment.status = "success";
        payment.refundStatus = "failed";
        await payment.save();
      }
      console.log(`Migrated booking ${booking._id} to paymentStatus='paid' (refund failed)`);
      fixCountC++;
    }

    console.log(`Migration complete. Fixed: A=${fixCountA}, B=${fixCountB}, C=${fixCountC}`);

    // ==========================================
    // 3. AFTER FIX REPORT
    // ==========================================
    console.log("\n=== AFTER FIX REPORT ===");
    
    const inconsistentBookingsAfter = await Booking.find({
      paymentStatus: "refunded",
      refund_status: "pending"
    });
    console.log(`- Bookings (paymentStatus='refunded' && refund_status='pending'): ${inconsistentBookingsAfter.length}`);
    
    const inconsistentPaymentsAfter = await Payment.find({
      status: "refunded",
      refundStatus: "pending"
    });
    console.log(`- Payments (status='refunded' && refundStatus='pending'): ${inconsistentPaymentsAfter.length}`);

    const processedMismatchesAfter = await Booking.find({
      refund_status: "processed",
      paymentStatus: { $ne: "refunded" }
    });
    console.log(`- Bookings (refund_status='processed' && paymentStatus!='refunded'): ${processedMismatchesAfter.length}`);

    const failedMismatchesAfter = await Booking.find({
      refund_status: "failed",
      paymentStatus: "refunded"
    });
    console.log(`- Bookings (refund_status='failed' && paymentStatus='refunded'): ${failedMismatchesAfter.length}`);

    if (inconsistentBookingsAfter.length === 0 && 
        inconsistentPaymentsAfter.length === 0 && 
        processedMismatchesAfter.length === 0 && 
        failedMismatchesAfter.length === 0) {
      console.log("\n✅ SUCCESS: All database records are fully synchronized and consistent!");
    } else {
      console.error("\n❌ ERROR: Some database inconsistencies remain.");
    }

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

runMigration();
