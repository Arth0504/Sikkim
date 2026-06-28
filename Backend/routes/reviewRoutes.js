import express from 'express';
const router = express.Router();

import { protect, isAdmin } from '../middleware/authMiddleware.js';
import {
  createReview,
  getReviewsForPackage,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  updateReviewStatusAdmin,
} from '../controllers/reviewController.js';

// Optional Authentication Middleware for Package Reviews to see userReview
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};

// USER ROUTES
router.post("/", protect, createReview);
router.get("/package/:packageId", optionalAuth, getReviewsForPackage);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);

// ADMIN ROUTES
router.get("/admin/all", protect, isAdmin, getAllReviewsAdmin);
router.put("/admin/:reviewId/status", protect, isAdmin, updateReviewStatusAdmin);
router.delete("/admin/:reviewId", protect, isAdmin, deleteReview);

export default router;
