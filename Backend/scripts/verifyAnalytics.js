import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { getAnalyticsDashboard } from "../controllers/adminAnalyticsController.js";

dotenv.config();

const runTest = async () => {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Database connected successfully! ✅");

    // Creating mock request/response objects to run the controller locally
    const req = {};
    const res = {
      status: (code) => {
        console.log(`Response status code: ${code}`);
        return {
          json: (data) => {
            console.log("\n--- ANALYTICS OUTPUT SUMMARY ---");
            console.log(`Booking Seasonality Peak:`, data.bookingTrend.peakMonths);
            console.log(`Total Revenue:`, data.revenue.total);
            console.log(`Average Booking Value:`, data.revenue.avgBookingValue);
            console.log(`Most Booked Package:`, data.packagePerformance.mostBooked);
            console.log(`Most Visited Monastery:`, data.monasteryInsights.mostVisited);
            console.log(`Most Popular Festival:`, data.festivalAnalytics.mostPopular);
            console.log(`Custom Reservations stats:`, data.customReservationStats);
            console.log(`AI Recommendations count:`, data.recommendations.length);
            console.log("\nAI Recommendations list:");
            data.recommendations.forEach(r => console.log(`- [${r.type.toUpperCase()}] ${r.message}`));
            console.log("\nAggregations run successfully without errors! ✅");
          }
        };
      }
    };

    console.log("Executing getAnalyticsDashboard controller...");
    await getAnalyticsDashboard(req, res);

    await mongoose.disconnect();
    console.log("\nDisconnected from Database. Verification successful.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Aggregation verification failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

runTest();
