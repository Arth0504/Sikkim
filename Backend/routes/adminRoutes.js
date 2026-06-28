import express from "express";
const router = express.Router();

// MIDDLEWARE
import { protect, isAdmin } from "../middleware/authMiddleware.js";

// DASHBOARD
import { getDashboardStats, getMonthlyAnalytics, getRecentActivity, getSystemHealth } from "../controllers/adminDashboardController.js";
import { getAdminStats } from "../controllers/adminStatsController.js";
import { getAnalyticsDashboard } from "../controllers/adminAnalyticsController.js";
import { suggestPackageDetails } from "../controllers/adminAssistantController.js";
import {
  getAdminQueries,
  getAdminQueryById,
  replyAdminQuery,
  updateAdminQueryStatus,
  toggleQueryReadStatus,
} from "../controllers/queryController.js";

// USERS
import {
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
  blockUserByAdmin,
  unblockUserByAdmin,
} from "../controllers/adminUserController.js";

// BOOKINGS
import {
  getAllBookingsAdmin,
  getCancelRequestsAdmin,
  confirmBookingAdmin,
  unconfirmBookingAdmin,
  resendInvoiceEmailAdmin,
} from "../controllers/adminBookingController.js";

import {
  updateBookingAdmin,
  deleteBookingAdmin,
  blockBookingAdmin,
  unblockBookingAdmin,
} from "../controllers/adminBookingCrudController.js";

// REFUND
import { refundBooking, rejectRefund } from "../controllers/adminRefundController.js";

// PAYMENTS
import {
  getAllPayments,
  getPaymentById,
  getPaymentStats,
  updatePaymentStatusAdmin,
  deletePaymentAdmin,
  getBookingTimeline,
  getTransactionLifecycle,
} from "../controllers/adminPaymentController.js";

// PACKAGES
import {
  addPackage,
  updatePackage,
  deletePackage,
} from "../controllers/adminPackageController.js";

// MONASTERIES
import {
  addMonastery,
  updateMonastery,
  deleteMonastery,
} from "../controllers/adminMonasteryController.js";

// FESTIVALS
import {
  getAllFestivals,
  addFestival,
  updateFestival,
  deleteFestival,
} from "../controllers/adminFestivalController.js";

// FESTIVAL REMINDERS
import {
  getReminderStatsAdmin,
  triggerReminders,
  sendReminderManuallyAdmin,
} from "../controllers/festivalReminderController.js";

// NOTIFICATIONS
import {
  getNotifications,
  markRead,
  markAllRead,
} from "../controllers/adminNotificationController.js";

// DRIVERS
import {
  getDrivers,
  addDriver,
  updateDriver,
  deleteDriver,
  assignDriver,
} from "../controllers/driverController.js";

// IMAGE UPLOAD MIDDLEWARE
import uploadFestivalImage from "../config/multerFestival.js";
import uploadMonasteryImage from "../config/multerMonastery.js";

import {
  getAdminReservations,
  updateReservationStatus,
} from "../controllers/customReservationController.js";

// ================= ROUTES =================

// DASHBOARD
router.get("/dashboard-stats", protect, isAdmin, getDashboardStats);
router.get("/analytics/monthly", protect, isAdmin, getMonthlyAnalytics);
router.get("/analytics/dashboard", protect, isAdmin, getAnalyticsDashboard);
router.get("/assistant/suggest", protect, isAdmin, suggestPackageDetails);
router.get("/recent-activity", protect, isAdmin, getRecentActivity);
router.get("/system-health", protect, isAdmin, getSystemHealth);
router.get("/stats", protect, isAdmin, getAdminStats);

// BOOKINGS
router.get("/bookings", protect, isAdmin, getAllBookingsAdmin);
router.get("/cancel-requests", protect, isAdmin, getCancelRequestsAdmin);

router.put("/bookings/:bookingId/confirm", protect, isAdmin, confirmBookingAdmin);
router.put("/bookings/:bookingId/unconfirm", protect, isAdmin, unconfirmBookingAdmin);
router.post("/bookings/:bookingId/resend-invoice", protect, isAdmin, resendInvoiceEmailAdmin);

// REFUND
router.put("/bookings/:bookingId/refund", protect, isAdmin, refundBooking);
router.put("/bookings/:bookingId/reject-refund", protect, isAdmin, rejectRefund);

// PAYMENTS
router.get("/payments", protect, isAdmin, getAllPayments);
router.get("/payments-stats", protect, isAdmin, getPaymentStats);
router.get("/payments/:paymentId", protect, isAdmin, getPaymentById);
router.put("/payments/:paymentId/status", protect, isAdmin, updatePaymentStatusAdmin);
router.delete("/payments/:paymentId/delete", protect, isAdmin, deletePaymentAdmin);
router.get("/bookings/:bookingId/timeline", protect, isAdmin, getBookingTimeline);
router.get("/transactions/:id/lifecycle", protect, isAdmin, getTransactionLifecycle);

// USERS
router.get("/users", protect, isAdmin, getAllUsers);
router.put("/users/:userId", protect, isAdmin, updateUserByAdmin);
router.delete("/users/:userId", protect, isAdmin, deleteUserByAdmin);

router.put("/users/:userId/block", protect, isAdmin, blockUserByAdmin);
router.put("/users/:userId/unblock", protect, isAdmin, unblockUserByAdmin);

// BOOKING CRUD
router.put("/bookings/:bookingId/update", protect, isAdmin, updateBookingAdmin);
router.delete("/bookings/:bookingId/delete", protect, isAdmin, deleteBookingAdmin);
router.put("/bookings/:bookingId/block", protect, isAdmin, blockBookingAdmin);
router.put("/bookings/:bookingId/unblock", protect, isAdmin, unblockBookingAdmin);

// PACKAGES
router.post("/packages", protect, isAdmin, addPackage);
router.put("/packages/:id", protect, isAdmin, updatePackage);
router.delete("/packages/:id", protect, isAdmin, deletePackage);

// MONASTERIES
router.post("/monasteries", protect, isAdmin, uploadMonasteryImage.single("image"), addMonastery);
router.put("/monasteries/:id", protect, isAdmin, uploadMonasteryImage.single("image"), updateMonastery);
router.delete("/monasteries/:id", protect, isAdmin, deleteMonastery);

// FESTIVALS
router.get("/festivals", protect, isAdmin, getAllFestivals);
router.post("/festivals", protect, isAdmin, uploadFestivalImage.single("image"), addFestival);
router.put("/festivals/:id", protect, isAdmin, uploadFestivalImage.single("image"), updateFestival);
router.delete("/festivals/:id", protect, isAdmin, deleteFestival);

// QUERIES
router.get("/queries", protect, isAdmin, getAdminQueries);
router.get("/queries/:id", protect, isAdmin, getAdminQueryById);
router.put("/queries/:id/reply", protect, isAdmin, replyAdminQuery);
router.put("/queries/:id/status", protect, isAdmin, updateAdminQueryStatus);
router.put("/queries/:id/toggle-read", protect, isAdmin, toggleQueryReadStatus);

// FESTIVAL REMINDERS
router.get("/reminders/stats", protect, isAdmin, getReminderStatsAdmin);
router.post("/reminders/trigger", protect, isAdmin, triggerReminders);
router.post("/reminders/send-manual/:reminderId", protect, isAdmin, sendReminderManuallyAdmin);

// NOTIFICATIONS
router.get("/notifications", protect, isAdmin, getNotifications);
router.put("/notifications/:id/read", protect, isAdmin, markRead);
router.put("/notifications/mark-all-read", protect, isAdmin, markAllRead);

// DRIVERS
router.get("/drivers", protect, isAdmin, getDrivers);
router.post("/drivers", protect, isAdmin, addDriver);
router.put("/drivers/:id", protect, isAdmin, updateDriver);
router.delete("/drivers/:id", protect, isAdmin, deleteDriver);
router.put("/bookings/:bookingId/assign-driver", protect, isAdmin, assignDriver);

// CUSTOM RESERVATIONS
router.get("/reservations", protect, isAdmin, getAdminReservations);
router.put("/reservations/:id", protect, isAdmin, updateReservationStatus);

export default router;