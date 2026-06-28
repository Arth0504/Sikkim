import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Transaction from "../models/Transaction.js";
import { getTransactionLifecycle } from "../controllers/adminPaymentController.js";
import { createTransactionRecord } from "../utils/transactionLogger.js";

dotenv.config();

const runTest = async () => {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Database connected successfully.");

    // 1. Create a dummy user
    console.log("Creating test User...");
    const testUser = await User.create({
      name: "Test User",
      email: `test_${Date.now()}@example.com`,
      password: "password123",
      role: "user"
    });

    // 2. Create a dummy package
    console.log("Creating test Package...");
    const testPackage = await Package.create({
      name: "Test Spiritual Package",
      description: "A wonderful spiritual package.",
      price: 15000,
      duration: "5 Days",
      location: "Leh",
      images: ["image.jpg"]
    });

    // 3. Create a dummy booking
    console.log("Creating test Booking...");
    const testBooking = await Booking.create({
      user: testUser._id,
      package: testPackage._id,
      firstName: "John",
      lastName: "Doe",
      mobile: "9876543210",
      age: 30,
      address: "123 Street",
      idProofNumber: "ABCD12345",
      travelStartDate: new Date(),
      persons: 2,
      totalAmount: 30000
    });

    // 4. Create a dummy payment
    console.log("Creating test Payment...");
    const testPayment = await Payment.create({
      user: testUser._id,
      booking: testBooking._id,
      amount: 30000,
      status: "success",
      razorpayOrderId: "order_test_123",
      razorpayPaymentId: "pay_test_123"
    });

    // 5. Log transaction lifecycle events using helper
    console.log("Logging transaction lifecycle events...");
    await createTransactionRecord({
      bookingId: testBooking._id,
      userId: testUser._id,
      packageName: testPackage.name,
      amount: 30000,
      transactionStatus: "PAYMENT_SUCCESS"
    });

    await createTransactionRecord({
      bookingId: testBooking._id,
      userId: testUser._id,
      packageName: testPackage.name,
      amount: 30000,
      transactionStatus: "CANCELLATION_REQUESTED"
    });

    await createTransactionRecord({
      bookingId: testBooking._id,
      userId: testUser._id,
      packageName: testPackage.name,
      amount: 30000,
      transactionStatus: "CANCELLATION_APPROVED"
    });

    await createTransactionRecord({
      bookingId: testBooking._id,
      userId: testUser._id,
      packageName: testPackage.name,
      amount: 30000,
      transactionStatus: "REFUND_PENDING"
    });

    await createTransactionRecord({
      bookingId: testBooking._id,
      userId: testUser._id,
      packageName: testPackage.name,
      amount: 30000,
      transactionStatus: "REFUND_PROCESSED"
    });

    // 6. Test the controller function using mock req and res
    console.log("\nTesting getTransactionLifecycle controller...");
    const req = {
      params: {
        id: testPayment._id.toString()
      }
    };

    let responseData = null;
    let responseStatus = null;
    const res = {
      status: function (code) {
        responseStatus = code;
        return this;
      },
      json: function (data) {
        responseData = data;
        return this;
      }
    };

    await getTransactionLifecycle(req, res);

    console.log("Response status code:", responseStatus);
    console.log("Response data (transaction lifecycle status list):");
    console.log(JSON.stringify(responseData, null, 2));

    // Verify requirements:
    // Should return [ PAYMENT_SUCCESS, CANCELLATION_REQUESTED, CANCELLATION_APPROVED, REFUND_PENDING, REFUND_PROCESSED ]
    const expected = [
      "PAYMENT_SUCCESS",
      "CANCELLATION_REQUESTED",
      "CANCELLATION_APPROVED",
      "REFUND_PENDING",
      "REFUND_PROCESSED"
    ];

    const isMatch = Array.isArray(responseData) &&
      responseData.length === expected.length &&
      responseData.every((val, index) => val === expected[index]);

    if (isMatch) {
      console.log("\n✅ SUCCESS: Lifecycle array matches exact specifications!");
    } else {
      console.error("\n❌ ERROR: Lifecycle array does not match expected output.");
    }

    // 7. Cleanup
    console.log("\nCleaning up test data...");
    await Payment.findByIdAndDelete(testPayment._id);
    await Booking.findByIdAndDelete(testBooking._id);
    await Package.findByIdAndDelete(testPackage._id);
    await User.findByIdAndDelete(testUser._id);
    await Transaction.deleteMany({ bookingId: testBooking._id });
    console.log("Cleanup complete.");

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

runTest();
