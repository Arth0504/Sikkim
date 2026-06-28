import express from 'express';
const router = express.Router();

import { getAllBookingsAdmin,
  confirmBookingAdmin,
  unconfirmBookingAdmin,
 } from '../controllers/adminBookingController.js';

import { protect, isAdmin  } from '../middleware/authMiddleware.js';

// ✅ Admin: Get all bookings
router.get("/bookings", protect, isAdmin, getAllBookingsAdmin);

// ✅ Admin: Confirm booking
router.put("/bookings/:bookingId/confirm", protect, isAdmin, confirmBookingAdmin);

// ✅ Admin: Unconfirm booking (back to pending)
router.put(
  "/bookings/:bookingId/unconfirm",
  protect,
  isAdmin,
  unconfirmBookingAdmin
);

export default router;;
