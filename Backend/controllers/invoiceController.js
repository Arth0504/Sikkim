import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import generateInvoice from '../utils/generateInvoice.js';

// USER / ADMIN: DOWNLOAD INVOICE
export const downloadInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("package")
      .populate("user")
      .populate("driver");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization: only owner or admin can download
    if (booking.user && String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to download this invoice" });
    }

    // Track PDF Downloads Count
    booking.downloadsCount = (booking.downloadsCount || 0) + 1;
    await booking.save();

    const payment = await Payment.findOne({ booking: bookingId }).sort({ createdAt: -1 });

    const isCancellation = booking.bookingStatus === "cancelled";

    const invoiceData = {
      bookingId: booking._id,
      userName: booking.user?.name || "Guest",
      userEmail: booking.user?.email || "",
      firstName: booking.firstName,
      lastName: booking.lastName,
      mobile: booking.mobile,
      age: booking.age,
      address: booking.address,
      idProofType: booking.idProofType,
      idProofNumber: booking.idProofNumber,
      travellers: booking.travellers || [],
      packageName: booking.package?.name || "Unknown Package",
      travelDate: booking.travelStartDate ? booking.travelStartDate.toDateString() : "-",
      persons: booking.persons,
      amount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      
      // Cancellation specific fields
      refundId: booking.refund_id || payment?.refundId || "N/A",
      refundAmount: booking.refund_amount || payment?.refundAmount || 0,
      refundStatus: booking.refund_status || payment?.refundStatus || "Processed",
      refundDate: booking.refunded_at ? booking.refunded_at.toDateString() : (booking.cancelledAt ? booking.cancelledAt.toDateString() : new Date().toDateString()),
      refundPercent: booking.refund_amount && booking.totalAmount ? Math.round((booking.refund_amount / booking.totalAmount) * 100) : 0,
      cancellationReason: booking.cancellationReason || booking.cancelReason || "User Request",
      approvedByAdmin: "Admin Portal",
    };

    await generateInvoice(res, invoiceData, isCancellation);
  } catch (error) {
    console.error("Download Invoice Error:", error);
    res.status(500).json({ message: error.message });
  }
};
