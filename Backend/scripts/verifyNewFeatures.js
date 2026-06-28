import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import Booking from "../models/Booking.js";
import Invoice from "../models/Invoice.js";
import Wishlist from "../models/Wishlist.js";
import Driver from "../models/Driver.js";

dotenv.config();

const runVerification = async () => {
  try {
    console.log("Starting verification of new features...");
    await connectDB();

    // 1. Fetch User & Package references
    const user = await User.findOne();
    const pkg = await Package.findOne();

    if (!user) {
      console.warn("⚠️ No users found in database to perform verification. Skipping write tests.");
      await mongoose.disconnect();
      process.exit(0);
    }
    if (!pkg) {
      console.warn("⚠️ No packages found in database to perform verification. Skipping write tests.");
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`Using test user: ${user.name} (${user.email})`);
    console.log(`Using test package: ${pkg.name}`);

    // 2. Wishlist System Test
    console.log("\n--- Testing Wishlist System ---");
    // Ensure clean state
    await Wishlist.deleteMany({ user: user._id, package: pkg._id });
    
    // Add to wishlist
    const wish = await Wishlist.create({ user: user._id, package: pkg._id });
    console.log("Successfully created Wishlist item:", wish._id);
    
    // Retrieve wishlist
    const retrievedWish = await Wishlist.findOne({ user: user._id, package: pkg._id });
    if (!retrievedWish) throw new Error("Failed to retrieve created wishlist item.");
    console.log("Successfully verified Wishlist retrieval.");

    // Clean up wishlist
    await Wishlist.deleteOne({ _id: wish._id });
    console.log("Successfully cleaned up Wishlist item.");

    // 4. Booking & Invoice System Test
    console.log("\n--- Testing Booking & Invoice System ---");
    // Create temporary booking
    const booking = await Booking.create({
      user: user._id,
      package: pkg._id,
      firstName: "Verify",
      lastName: "Test",
      mobile: "9999999999",
      age: 25,
      address: "Verify Address",
      idProofNumber: "1234-5678-9012",
      travelStartDate: new Date(),
      persons: 2,
      totalAmount: 15000,
    });
    console.log("Successfully created temporary Booking:", booking._id);

    // Create invoice history log
    const invoice = await Invoice.create({
      booking: booking._id,
      user: user._id,
      invoiceType: "booking_confirmation",
      amount: 15000,
      sentTo: user.email,
      status: "sent",
    });
    console.log("Successfully created Invoice log:", invoice._id);

    // Assert retrieval
    const retrievedInvoice = await Invoice.findOne({ booking: booking._id });
    if (!retrievedInvoice) throw new Error("Failed to retrieve invoice statement.");
    console.log("Successfully verified Invoice statement retrieval.");

    // Clean up
    await Invoice.deleteOne({ _id: invoice._id });
    await Booking.deleteOne({ _id: booking._id });
    console.log("Successfully cleaned up Booking & Invoice data.");

    // 5. Driver System Test
    console.log("\n--- Testing Driver & Driver Allocation System ---");
    // Create Driver
    const testDriver = await Driver.create({
      name: "Test Driver",
      phone: "9876543210",
      vehicleNumber: "SK-01-T-9999",
      vehicleType: "Innova",
      status: "available",
    });
    console.log("Successfully created test Driver:", testDriver._id);

    // Create Temporary Booking to test assignment
    const tempBooking = await Booking.create({
      user: user._id,
      package: pkg._id,
      firstName: "Verify",
      lastName: "DriverTest",
      mobile: "9999999999",
      age: 25,
      address: "Verify Driver Address",
      idProofNumber: "1234-5678-9012",
      travelStartDate: new Date(),
      persons: 1,
      totalAmount: 5000,
      bookingStatus: "confirmed",
    });

    // Test assignment logic: set driver on booking
    tempBooking.driver = testDriver._id;
    testDriver.status = "busy";
    await tempBooking.save();
    await testDriver.save();
    console.log("Successfully assigned Driver to Booking.");

    // Retrieve and verify
    const populatedBooking = await Booking.findById(tempBooking._id).populate("driver");
    if (!populatedBooking.driver || String(populatedBooking.driver._id) !== String(testDriver._id)) {
      throw new Error("Failed to verify driver population on booking.");
    }
    if (populatedBooking.driver.status !== "busy") {
      throw new Error("Driver status did not update to 'busy' after assignment.");
    }
    console.log("Successfully verified Driver assignment and population.");

    // Clean up driver & booking
    await Booking.deleteOne({ _id: tempBooking._id });
    await Driver.deleteOne({ _id: testDriver._id });
    console.log("Successfully cleaned up Driver & temporary Booking.");

    // 5. Package Comparison System Test
    console.log("\n--- Testing Package Comparison System ---");
    const originalCompareCount = pkg.compareCount || 0;
    
    // Increment compare count
    pkg.compareCount = originalCompareCount + 1;
    await pkg.save();
    
    const updatedPkg = await Package.findById(pkg._id);
    if (updatedPkg.compareCount !== originalCompareCount + 1) {
      throw new Error(`Package compareCount mismatch. Expected: ${originalCompareCount + 1}, got: ${updatedPkg.compareCount}`);
    }
    console.log(`Successfully verified Package comparison count increment: ${updatedPkg.compareCount}`);

    // Revert package comparison count
    pkg.compareCount = originalCompareCount;
    await pkg.save();
    console.log("Successfully reverted Package comparison count to original value.");

    console.log("\n✅ [VERIFY SUCCESS] All remaining features verified cleanly!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ [VERIFY FAILED] Error during verification:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

runVerification();
