import express from 'express';
const router = express.Router();

import { protect, isAdmin } from '../middleware/authMiddleware.js';
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getMostWishlistedPackages,
} from '../controllers/wishlistController.js';

// USER ROUTES
router.post("/", protect, addToWishlist);
router.delete("/:packageId", protect, removeFromWishlist);
router.get("/", protect, getWishlist);

// ADMIN ROUTES
router.get("/admin/stats", protect, isAdmin, getMostWishlistedPackages);

export default router;
