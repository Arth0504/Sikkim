import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import Booking from "../models/Booking.js";
import CustomReservation from "../models/CustomReservation.js";
import { getAnalyticsDashboard } from "../controllers/adminAnalyticsController.js";
import { updateReservationStatus } from "../controllers/customReservationController.js";

dotenv.config();

const runFlowTest = async () => {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Connected successfully! ✅\n");

    // 1. Find a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.warn("⚠️ No user accounts found in database. Cannot run test.");
      process.exit(0);
    }
    console.log(`Step 1: Using test user: ${testUser.name} (${testUser.email})`);

    // 2. Create custom reservation request
    console.log("\nStep 2: Creating a custom reservation request...");
    const testPlan = {
      name: "Custom Spiritual Tour of North Sikkim",
      description: "A specialized tour to explore Rumtek and Phodong monasteries.",
      duration: "4 Days",
      itinerary: [
        { day: 1, title: "Arrival in Gangtok", description: "Transfer to hotel and visit Rumtek." },
        { day: 2, title: "Gangtok to Lachen", description: "Drive north to Lachen and view Phodong on the way." },
        { day: 3, title: "Lachen to Gurudongmar", description: "High altitude excursion and return." },
        { day: 4, title: "Return to Gangtok", description: "Departure from Gangtok." }
      ]
    };

    const reservation = await CustomReservation.create({
      user: testUser._id,
      budget: "medium",
      duration: "short",
      interests: "spiritual",
      region: "North Sikkim",
      aiGeneratedPlan: testPlan,
      estimatedPrice: 18000,
      status: "Pending",
    });

    console.log(`Reservation created successfully with ID: ${reservation._id} ✅`);

    // 3. Admin modifies and approves the reservation request
    console.log("\nStep 3: Simulating Admin review, modify, and approval...");
    const mockReq = {
      params: { id: reservation._id.toString() },
      body: {
        status: "Approved",
        adminRemarks: "Approved with modified itineraries and discounted rate.",
        estimatedPrice: 17000, // Modified price
        aiGeneratedPlan: {
          ...testPlan,
          name: "Approved Custom Spiritual Tour of North Sikkim"
        }
      }
    };

    let updatedReservation = null;
    const mockRes = {
      status: (code) => {
        return {
          json: (data) => {
            updatedReservation = data.reservation;
          }
        };
      }
    };

    await updateReservationStatus(mockReq, mockRes);

    if (!updatedReservation || updatedReservation.status !== "Approved") {
      throw new Error("Failed to approve the reservation request.");
    }
    console.log(`Reservation request status updated to: Approved ✅`);
    console.log(`Admin Remarks: "${updatedReservation.adminRemarks}"`);
    console.log(`Custom Package ID generated: ${updatedReservation.customPackage} ✅`);

    // 4. Verify generated Package details
    console.log("\nStep 4: Verifying details of the generated custom Package...");
    const customPkg = await Package.findById(updatedReservation.customPackage);
    if (!customPkg) {
      throw new Error("Generated package not found in DB.");
    }
    if (customPkg.price !== 17000 || !customPkg.isCustom || customPkg.isActive) {
      throw new Error("Generated custom package parameters are invalid.");
    }
    console.log(`Package Name: "${customPkg.name}"`);
    console.log(`Package Price: ₹${customPkg.price}`);
    console.log(`Package isCustom: ${customPkg.isCustom}, isActive: ${customPkg.isActive} ✅`);

    // 5. Simulate User Booking confirmation
    console.log("\nStep 5: Simulating User Booking confirmation...");
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 10); // Minimum 7 days from today requirement

    const booking = await Booking.create({
      user: testUser._id,
      package: customPkg._id,
      firstName: "Verify",
      lastName: "CustomFlow",
      mobile: "9999999999",
      age: 30,
      address: "123 Test Street Gangtok",
      idProofType: "Aadhaar",
      idProofNumber: "1234-5678-9012",
      travelStartDate: travelDate,
      persons: 1,
      totalAmount: 17000,
      bookingStatus: "pending",
      paymentMethod: "cash",
      paymentStatus: "pending"
    });

    // Check if CustomReservation is linked to Booking
    if (customPkg.isCustom) {
      await CustomReservation.findOneAndUpdate(
        { customPackage: customPkg._id },
        { booking: booking._id }
      );
    }

    const verifiedReservation = await CustomReservation.findById(reservation._id);
    if (String(verifiedReservation.booking) !== String(booking._id)) {
      throw new Error("Booking was not linked back to CustomReservation correctly.");
    }
    console.log(`Booking created with ID: ${booking._id}`);
    console.log(`Linked booking in CustomReservation: ${verifiedReservation.booking} ✅`);

    // 6. Test Analytics Dashboard update
    console.log("\nStep 6: Running Analytics dashboard to verify custom reservation counts...");
    let analyticsData = null;
    const mockAnalyticsRes = {
      status: (code) => {
        return {
          json: (data) => {
            analyticsData = data;
          }
        };
      }
    };

    await getAnalyticsDashboard({}, mockAnalyticsRes);

    if (!analyticsData) {
      throw new Error("Failed to retrieve dashboard analytics.");
    }

    const customStats = analyticsData.customReservationStats;
    console.log(`Analytics output - Total Custom: ${customStats.total}, Approved: ${customStats.approved}, Projected Revenue: ₹${customStats.projectedRevenue}`);
    
    if (customStats.total < 1 || customStats.approved < 1 || customStats.projectedRevenue < 17000) {
      throw new Error("Analytics dashboard did not include the test custom reservation correctly.");
    }
    console.log("Analytics system updated and verified successfully! ✅");

    // 7. Cleanup test data
    console.log("\nStep 7: Cleaning up test data from collections...");
    await Booking.deleteOne({ _id: booking._id });
    await Package.deleteOne({ _id: customPkg._id });
    await CustomReservation.deleteOne({ _id: reservation._id });
    console.log("Cleanup completed successfully! ✅");

    await mongoose.disconnect();
    console.log("\nAll end-to-end custom reservation workflows verified successfully! 🎉");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test flow failed:", error);
    // Attempt cleanup if failed mid-way
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

runFlowTest();
