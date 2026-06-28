import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import CustomReservation from "../models/CustomReservation.js";
import { updateReservationStatus } from "../controllers/customReservationController.js";

dotenv.config();

const runTest = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully! ✅\n");

    const testUser = await User.findOne();
    if (!testUser) {
      console.error("No users found in database to run verification.");
      process.exit(1);
    }

    // 1. Create a fresh custom reservation
    const reservation = await CustomReservation.create({
      user: testUser._id,
      budget: "medium",
      duration: "medium",
      interests: "spiritual",
      region: "West Sikkim",
      aiGeneratedPlan: {
        name: "Spiritual Path of West Sikkim",
        description: "Explore Pemayangtse and Tashiding.",
        duration: "5 Days",
        itinerary: [
          { day: 1, title: "Arrival", description: "Arrive in Pelling." },
          { day: 2, title: "Pemayangtse", description: "Visit the holy monastery." }
        ]
      },
      estimatedPrice: 15000,
      status: "Pending"
    });

    console.log(`[VERIFIED] Reservation created successfully.`);
    console.log(`- Reservation ID: ${reservation._id}`);

    // 2. Simulating Admin approval to generate package
    const mockReq = {
      params: { id: reservation._id.toString() },
      body: {
        status: "Approved",
        adminRemarks: "Itinerary reviewed and custom package generated successfully.",
        estimatedPrice: 14500
      }
    };

    let updatedResObj = null;
    const mockRes = {
      status: (code) => {
        return {
          json: (data) => {
            updatedResObj = data.reservation;
          }
        };
      }
    };

    await updateReservationStatus(mockReq, mockRes);

    if (!updatedResObj || updatedResObj.status !== "Approved") {
      throw new Error("Failed to update status to Approved.");
    }

    console.log(`[VERIFIED] Reservation approved and updated.`);
    console.log(`- Status: ${updatedResObj.status}`);
    console.log(`- Generated Package ID: ${updatedResObj.customPackage}`);

    // 3. Verify the generated package is in database
    const pkgInDb = await Package.findById(updatedResObj.customPackage);
    if (!pkgInDb) {
      throw new Error("Package not found in DB after generation.");
    }
    console.log(`[VERIFIED] Custom Package document exists in Database.`);
    console.log(`- Package Name: "${pkgInDb.name}"`);
    console.log(`- Package isCustom: ${pkgInDb.isCustom}`);
    console.log(`- Package isActive: ${pkgInDb.isActive}`);

    // 4. Construct Frontend Booking Redirect URL
    const bookingUrl = `http://localhost:5173/booking/${updatedResObj.customPackage}`;
    console.log(`\n========================================`);
    console.log(`* Reservation ID: ${reservation._id}`);
    console.log(`* Generated Package ID: ${updatedResObj.customPackage}`);
    console.log(`* Booking URL: ${bookingUrl}`);
    console.log(`========================================`);

    // Cleanup test data to prevent database pollution
    await Package.deleteOne({ _id: updatedResObj.customPackage });
    await CustomReservation.deleteOne({ _id: reservation._id });
    console.log("\nTest data cleaned up successfully. ✅");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Verification failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

runTest();
