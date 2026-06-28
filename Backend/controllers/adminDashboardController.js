import mongoose from 'mongoose';
import os from 'os';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Package from '../models/Package.js';
import Monastery from '../models/Monastery.js';
import Festival from '../models/Festival.js';
import User from '../models/User.js';
import Query from '../models/Query.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Wishlist from '../models/Wishlist.js';
import Invoice from '../models/Invoice.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

const startOfDay   = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const startOfWeek  = () => { const d = startOfDay(); d.setDate(d.getDate() - d.getDay()); return d; };
const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; };

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalBookings, confirmedBookings, cancelledBookings, pendingBookings,
      totalPackages, totalMonasteries, totalFestivals, totalUsers, googleUsers, otpUsers,
      revenueAll, revenueToday, revenueWeek, revenueMonth,
      paySuccess, payPending, payFailed,
      topPackagesRaw,
      pendingRefunds, approvedRefunds, rejectedRefunds,
      totalQueries, newQueries, pendingReplies, resolvedQueries,
      totalReviews, allApprovedReviews,
      totalNotifications, unreadNotifications,
      totalWishlists, totalInvoices, pdfDownloadsRaw, mostComparedPackages
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Booking.countDocuments({ bookingStatus: 'cancelled' }),
      Booking.countDocuments({ bookingStatus: 'pending' }),
      Package.countDocuments({ isCustom: { $ne: true } }),
      Monastery.countDocuments(),
      Festival.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', provider: 'google' }),
      User.countDocuments({ role: 'user', mobileVerified: true }),

      // revenue aggregations
      Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'success', createdAt: { $gte: startOfDay() } } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'success', createdAt: { $gte: startOfWeek() } } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'success', createdAt: { $gte: startOfMonth() } } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),

      // payment status counts
      Payment.countDocuments({ status: 'success' }),
      Payment.countDocuments({ status: 'created' }),
      Payment.countDocuments({ status: 'failed' }),

      // top 5 packages by booking count
      Booking.aggregate([
        { $group: { _id: '$package', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'packages', localField: '_id', foreignField: '_id', as: 'pkg' } },
        { $unwind: { path: '$pkg', preserveNullAndEmptyArrays: false } },
        { $project: { _id: 0, name: '$pkg.name', count: 1, price: '$pkg.price' } },
      ]),

      // Refund status counts
      Booking.countDocuments({ cancelStatus: 'pending' }),
      Booking.countDocuments({ cancelStatus: 'approved' }),
      Booking.countDocuments({ cancelStatus: 'rejected' }),

      // Query metrics
      Query.countDocuments(),
      Query.countDocuments({ status: 'NEW' }),
      Query.countDocuments({ status: { $in: ['NEW', 'IN_PROGRESS'] } }),
      Query.countDocuments({ status: 'CLOSED' }),

      // Review metrics
      Review.countDocuments(),
      Review.find({ isApproved: true }),

      // Notification metrics
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: false }),

      // New Metrics
      Wishlist.countDocuments(),
      Invoice.countDocuments(),
      Booking.aggregate([{ $group: { _id: null, total: { $sum: { $ifNull: [ "$downloadsCount", 0 ] } } } }]),
      Package.find({ isCustom: { $ne: true } }).sort({ compareCount: -1 }).limit(5).select('name compareCount price duration'),
    ]);

    const avgPlatformRating = allApprovedReviews.length > 0
      ? allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) / allApprovedReviews.length
      : 0;

    return res.status(200).json({
      bookings: { total: totalBookings, confirmed: confirmedBookings, cancelled: cancelledBookings, pending: pendingBookings },
      counts:   { packages: totalPackages, monasteries: totalMonasteries, festivals: totalFestivals, users: totalUsers, googleUsers, otpUsers },
      revenue:  {
        total:   revenueAll[0]?.t   || 0,
        today:   revenueToday[0]?.t  || 0,
        week:    revenueWeek[0]?.t   || 0,
        month:   revenueMonth[0]?.t  || 0,
      },
      payments: { success: paySuccess, pending: payPending, failed: payFailed },
      refunds:  { pending: pendingRefunds, approved: approvedRefunds, rejected: rejectedRefunds },
      queries:  { total: totalQueries, new: newQueries, pending: pendingReplies, resolved: resolvedQueries },
      reviews:  { total: totalReviews, avgRating: Number(avgPlatformRating.toFixed(1)) },
      notifications: { total: totalNotifications, unread: unreadNotifications },
      topPackages: topPackagesRaw,
      extraMetrics: {
        totalWishlists,
        activeChats: 0,
        totalInvoices,
        pdfDownloads: pdfDownloadsRaw[0]?.total || 0,
      },
      mostCompared: mostComparedPackages,
    });
  } catch (error) {
    console.error('DASHBOARD ERROR:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/admin/system-health ─────────────────────────────────────────────

export const getSystemHealth = async (req, res) => {
  try {
    const dbState    = mongoose.connection.readyState; // 1 = connected
    const totalMem   = os.totalmem();
    const freeMem    = os.freemem();
    const usedMemPct = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // cpu usage: sample load average (1 min) vs cpu count
    const cpus      = os.cpus().length;
    const loadAvg   = os.loadavg()[0];
    const cpuPct    = Math.min(100, Math.round((loadAvg / cpus) * 100));

    const uptimeSec = Math.floor(process.uptime());
    const hours     = Math.floor(uptimeSec / 3600);
    const minutes   = Math.floor((uptimeSec % 3600) / 60);
    const uptime    = `${hours}h ${minutes}m`;

    return res.status(200).json({
      server:   true,
      database: dbState === 1,
      razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      api:      true,
      metrics: {
        memory:  usedMemPct,
        cpu:     cpuPct,
        uptime,
        dbStatus: dbState === 1 ? 'Connected' : 'Disconnected',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/admin/analytics/monthly ────────────────────────────────────────

export const getMonthlyAnalytics = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const [revenueByMonth, bookingsByMonth] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
        { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
        { $group: { _id: { $month: '$createdAt' }, bookings: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const data = MONTHS.map((month, i) => {
      const m    = i + 1;
      const rev  = revenueByMonth.find((r) => r._id === m)?.revenue  || 0;
      const bks  = bookingsByMonth.find((b) => b._id === m)?.bookings || 0;
      return { month, revenue: rev, bookings: bks };
    });

    return res.status(200).json({ year, data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/admin/recent-activity ──────────────────────────────────────────

export const getRecentActivity = async (req, res) => {
  try {
    const [bookings, payments, packages, festivals, monasteries] = await Promise.all([
      Booking.find()
        .sort({ createdAt: -1 }).limit(5)
        .populate('user', 'name email')
        .populate('package', 'name')
        .select('firstName lastName bookingStatus totalAmount createdAt'),

      Payment.find({ status: 'success' })
        .sort({ createdAt: -1 }).limit(5)
        .populate('user', 'name')
        .populate({ path: 'booking', populate: { path: 'package', select: 'name' } })
        .select('amount razorpayPaymentId status createdAt'),

      Package.find({ isCustom: { $ne: true } })
        .sort({ createdAt: -1 }).limit(5)
        .select('name price duration createdAt'),

      Festival.find()
        .sort({ createdAt: -1 }).limit(5)
        .select('name month category createdAt'),

      Monastery.find()
        .sort({ createdAt: -1 }).limit(5)
        .select('name location createdAt'),
    ]);

    return res.status(200).json({ bookings, payments, packages, festivals, monasteries });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
