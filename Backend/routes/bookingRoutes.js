import express from 'express';
const router = express.Router();

import { protect, isAdmin  } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

import { createBooking, getMyBookings, cancelBooking  } from '../controllers/bookingController.js';

import { requestCancelBooking, cancelBookingAdmin } from '../controllers/bookingCancelController.js';
import { updateBookingStatusAdmin } from '../controllers/adminBookingController.js';
import { downloadItinerary } from '../controllers/itineraryController.js';

// ✅ CREATE BOOKING with image
router.post("/", protect, upload.single("passportPhoto"), createBooking);

// ✅ MY BOOKINGS
router.get("/my", protect, getMyBookings);
router.get("/user", protect, getMyBookings); // alias for requirements

// ✅ USER: Cancel Request (Admin will approve later)
router.put("/:bookingId/cancel-request", protect, requestCancelBooking);

// ✅ USER: Direct Cancel (as per new requirements)
router.put("/:id/cancel", protect, cancelBooking);

// ✅ ADMIN: Cancel and Refund (automatic Razorpay refund)
router.put("/cancel/:id", protect, isAdmin, cancelBookingAdmin);

// ✅ ADMIN: Update Status (as per new requirements)
router.put("/:id/status", protect, isAdmin, updateBookingStatusAdmin);

// ✅ ADMIN: Get all bookings (as per new requirements)
import { getAllBookingsAdmin } from '../controllers/adminBookingController.js';
router.get("/", protect, isAdmin, getAllBookingsAdmin);

// ✅ DOWNLOAD ITINERARY
router.get("/:bookingId/itinerary/download", protect, downloadItinerary);

export default router;
