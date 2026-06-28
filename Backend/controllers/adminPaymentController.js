import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';

// ✅ GET ALL PAYMENTS (with filter, search, sort)
export const getAllPayments = async (req, res) => {
  try {
    const { status, search, sort } = req.query;

    // Build match filter
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    let query = Payment.find(filter)
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        select: 'firstName lastName totalAmount package bookingStatus paymentStatus refund_status cancelledAt refunded_at',
        populate: { path: 'package', select: 'name duration' },
      });

    // Sort
    if (sort === 'oldest') query = query.sort({ createdAt: 1 });
    else if (sort === 'amount_desc') query = query.sort({ amount: -1 });
    else if (sort === 'amount_asc') query = query.sort({ amount: 1 });
    else query = query.sort({ createdAt: -1 }); // default: latest first

    let payments = await query.lean();

    // Search (post-query — order ID / payment ID / customer name)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      payments = payments.filter((p) => {
        const orderId = (p.razorpayOrderId || '').toLowerCase();
        const paymentId = (p.razorpayPaymentId || '').toLowerCase();
        const customerName = `${p.booking?.firstName || ''} ${p.booking?.lastName || ''}`.toLowerCase();
        const userName = (p.user?.name || '').toLowerCase();
        return (
          orderId.includes(q) ||
          paymentId.includes(q) ||
          customerName.includes(q) ||
          userName.includes(q)
        );
      });
    }

    return res.status(200).json(payments);
  } catch (error) {
    console.error('GET PAYMENTS ERROR =>', error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET PAYMENT STATS
export const getPaymentStats = async (req, res) => {
  try {
    const [total, successful, pending, failed, refunded] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'success' }),
      Payment.countDocuments({ status: 'created' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({ $or: [{ status: 'refunded' }, { refundStatus: 'refunded' }] }),
    ]);

    const revenueResult = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const refundResult = await Payment.aggregate([
      { $match: { refundStatus: 'refunded' } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
    const refundedAmount = refundResult[0]?.total || 0;

    return res.status(200).json({
      total,
      successful,
      pending,
      failed,
      refunded,
      totalRevenue,
      refundedAmount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET SINGLE PAYMENT
export const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        select: 'firstName lastName totalAmount package bookingStatus paymentStatus refund_status cancelledAt refunded_at',
        populate: { path: 'package', select: 'name duration' },
      });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE PAYMENT STATUS (Admin)
export const updatePaymentStatusAdmin = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    if (!['created', 'success', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.status = status;
    if (status === "refunded") {
      payment.refundStatus = "refunded";
    }
    await payment.save();

    // Sync status to corresponding booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      if (status === "success") booking.paymentStatus = "paid";
      else if (status === "failed") booking.paymentStatus = "failed";
      else if (status === "created") booking.paymentStatus = "pending";
      else if (status === "refunded") {
        booking.paymentStatus = "refunded";
        booking.refund_status = "processed";
      }
      await booking.save();
      console.log(`[Admin Payment Status Update] Booking ${booking._id} synchronized with status "${booking.paymentStatus}"`);
    }

    return res.status(200).json({ message: 'Payment status updated', payment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE PAYMENT (Admin)
export const deletePaymentAdmin = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByIdAndDelete(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    return res.status(200).json({ message: 'Payment deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET TRANSACTION TIMELINE (Admin)
export const getBookingTimeline = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const timeline = await Transaction.find({ bookingId }).sort({ createdAt: 1 });
    return res.status(200).json(timeline);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET TRANSACTION LIFECYCLE (Admin)
export const getTransactionLifecycle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find payment to get booking id
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment/Transaction not found' });
    }

    // Fetch transaction logs sorted by creation time
    const transactions = await Transaction.find({ bookingId: payment.booking }).sort({ createdAt: 1 });
    
    // Extract transactionStatus array
    const lifecycle = transactions.map(t => t.transactionStatus);
    
    return res.status(200).json(lifecycle);
  } catch (error) {
    console.error("GET TRANSACTION LIFECYCLE ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};
