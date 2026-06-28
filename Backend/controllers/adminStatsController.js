import Package from '../models/Package.js';
import Monastery from '../models/Monastery.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

export const getAdminStats = async (req, res) => {
  try {
    const packages = await Package.countDocuments({ isCustom: { $ne: true } });
    const monasteries = await Monastery.countDocuments();
    const bookings = await Booking.countDocuments();

    const pending = await Booking.countDocuments({ bookingStatus: "pending" });
    const cancelled = await Booking.countDocuments({ bookingStatus: "cancelled" });

    const payments = await Payment.find({ status: "success" });
    const revenue = payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    return res.status(200).json({
      packages,
      monasteries,
      bookings,
      revenue,
      pending,
      cancelled,
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
