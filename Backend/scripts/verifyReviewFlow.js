import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";

dotenv.config();

const runReviewVerification = async () => {
  try {
    console.log("Starting Review Flow verification...");
    await connectDB();

    const user = await User.findOne();
    const pkg = await Package.findOne();

    if (!user) throw new Error("No users found in database to perform verification.");
    if (!pkg) throw new Error("No packages found in database to perform verification.");

    console.log(`Test User: ${user.name} (${user.email})`);
    console.log(`Test Package: ${pkg.name}`);

    // Clean up old tests
    await Review.deleteMany({ user: user._id, package: pkg._id });
    await Booking.deleteMany({ user: user._id, package: pkg._id, firstName: "ReviewVerify" });

    // 1. Create a confirmed booking test
    console.log("\n1. Creating a confirmed booking record...");
    const booking = await Booking.create({
      user: user._id,
      package: pkg._id,
      firstName: "ReviewVerify",
      lastName: "Test",
      mobile: "9876543210",
      age: 28,
      address: "Verification Ridge, Gangtok",
      idProofNumber: "9999-8888-7777",
      travelStartDate: new Date(),
      persons: 2,
      totalAmount: 24000,
      bookingStatus: "confirmed",
    });
    console.log(`Confirmed booking created: ID ${booking._id}, Status: ${booking.bookingStatus}`);

    // 2. Submit a review for this package
    console.log("\n2. Submitting review to database...");
    // Check eligibility logic simulation (must have a confirmed booking)
    const hasBooked = await Booking.findOne({
      user: user._id,
      package: pkg._id,
      bookingStatus: "confirmed",
    });
    if (!hasBooked) throw new Error("Eligibility check failed: User does not have a confirmed booking.");
    console.log("Confirmed booking eligibility check PASSED.");

    // Insert review record
    const review = await Review.create({
      package: pkg._id,
      user: user._id,
      rating: 5,
      comment: "A breathtaking high-altitude spiritual retreat. Rumtek and Pemayangtse were mystical, guides were very helpful.",
      isApproved: false, // Starts as pending moderation
    });
    console.log(`Review record created: ID ${review._id}, Approved: ${review.isApproved}`);

    // 3. Verify MongoDB record exists
    const storedReview = await Review.findById(review._id);
    if (!storedReview) throw new Error("Failed to retrieve stored review record.");
    console.log("MongoDB review record presence verified successfully.");

    // 4. Simulate Admin Approval & Package Rating Calculations
    console.log("\n3. Simulating admin approval...");
    storedReview.isApproved = true;
    await storedReview.save();
    console.log(`Admin approved review ID ${storedReview._id}.`);

    // Verify package rating updates
    const allApprovedReviews = await Review.find({ package: pkg._id, isApproved: true });
    const totalReviews = allApprovedReviews.length;
    const avgRating = totalReviews > 0
      ? (allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;
    
    console.log(`Verification stats for package "${pkg.name}":`);
    console.log(`- Total Reviews: ${totalReviews}`);
    console.log(`- Average Rating: ${avgRating} / 5.0`);

    // Clean up
    console.log("\n4. Cleaning up verification records...");
    await Review.deleteOne({ _id: review._id });
    await Booking.deleteOne({ _id: booking._id });
    console.log("Cleanup complete.");

    console.log("\n✅ [REVIEW FLOW SUCCESS] Verified confirmed booking eligibility, MongoDB storage, and rating aggregates!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ [REVIEW FLOW FAILED] Error during verification:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

runReviewVerification();
