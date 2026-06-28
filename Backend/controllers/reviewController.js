import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Package from '../models/Package.js';
import { createAdminNotification } from '../utils/adminNotificationHelper.js';

// ✅ CREATE REVIEW
export const createReview = async (req, res) => {
  try {
    const { packageId, rating, comment } = req.body;

    if (!packageId || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user has booked this package
    const hasBooked = await Booking.findOne({
      user: req.user._id,
      package: packageId,
      bookingStatus: "confirmed",
    });

    if (!hasBooked) {
      return res.status(403).json({ message: "Only users who have a confirmed booking for this package can write a review." });
    }

    // Check if already reviewed
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      package: packageId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: "You have already reviewed this package. You can edit your existing review instead." });
    }

    const review = await Review.create({
      package: packageId,
      user: req.user._id,
      rating: Number(rating),
      comment,
      isApproved: false, // Moderated by default
    });

    const pkg = await Package.findById(packageId);
    const pkgName = pkg ? pkg.name : "Unknown Package";

    // Auto-create Admin Notification
    await createAdminNotification({
      title: "New Review Submitted ⭐️",
      message: `New review submitted for package "${pkgName}" by traveler ${req.user.name} with rating: ${rating} stars.`,
      type: "NEW_REVIEW",
      referenceId: review._id.toString(),
      actionUrl: "/admin/reviews",
    });

    return res.status(201).json({
      message: "Review submitted successfully! It will be visible once approved by an administrator. 📝",
      review,
    });
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET REVIEWS FOR A PACKAGE
export const getReviewsForPackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    const reviews = await Review.find({ package: packageId, isApproved: true })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });

    // Calculate Average Rating and Total Reviews
    const allReviews = await Review.find({ package: packageId, isApproved: true });
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    // Check if current user has already left a review (approved or pending)
    let userReview = null;
    if (req.user) {
      userReview = await Review.findOne({ package: packageId, user: req.user._id })
        .populate("user", "name profilePicture");
    }

    return res.status(200).json({
      reviews,
      totalReviews,
      avgRating: Number(avgRating),
      userReview,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE REVIEW
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Only review owner can update
    if (String(review.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    review.rating = Number(rating) || review.rating;
    review.comment = comment || review.comment;
    review.isApproved = false; // Reset to unapproved for moderation on update
    await review.save();

    return res.status(200).json({
      message: "Review updated successfully! It will be visible after admin approval. 📝",
      review,
    });
  } catch (error) {
    console.error("UPDATE REVIEW ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE REVIEW
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Owner or admin can delete
    if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Review.findByIdAndDelete(reviewId);

    return res.status(200).json({ message: "Review deleted successfully ✅" });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ================= ADMIN CONTROLLERS =================

// ✅ GET ALL REVIEWS FOR MODERATION
export const getAllReviewsAdmin = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("package", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("ADMIN GET REVIEWS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ APPROVE/REJECT REVIEW
export const updateReviewStatusAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.isApproved = isApproved;
    await review.save();

    return res.status(200).json({
      message: isApproved ? "Review Approved successfully! ✅" : "Review Rejected/Hidden successfully! 🚫",
      review,
    });
  } catch (error) {
    console.error("ADMIN REVIEW STATUS UPDATE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
