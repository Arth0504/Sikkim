import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import sendEmail from '../utils/sendEmail.js';
import { generateInvoicePDF } from '../utils/generateInvoice.js';
import { sendInvoiceEmailHelper } from '../utils/sendInvoiceEmail.js';

// ✅ ADMIN: Get all bookings (WITH payment + refund info)
export const getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("package", "name duration")
      .populate("driver")
      .sort({ createdAt: -1 });

    const bookingsWithPayment = await Promise.all(
      bookings.map(async (b) => {
        const payment = await Payment.findOne({ booking: b._id }).sort({
          createdAt: -1,
        });

        let mappedPaymentStatus = b.paymentStatus;
        if (payment) {
          if (payment.status === "success") mappedPaymentStatus = "paid";
          else if (payment.status === "created") mappedPaymentStatus = "pending";
          else if (payment.status === "failed") mappedPaymentStatus = "failed";
          else if (payment.status === "refunded") mappedPaymentStatus = "refunded";
        }

        return {
          ...b.toObject(),
          paymentStatus: mappedPaymentStatus,
          refundStatus: payment?.refundStatus || b.refund_status || "none",
          refundAmount: payment?.refundAmount || b.refund_amount || 0,
        };
      })
    );

    return res.status(200).json(bookingsWithPayment);
  } catch (error) {
    console.error("ADMIN GET BOOKINGS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Get only cancel requests (Pending Approval) (WITH payment/refund info)
export const getCancelRequestsAdmin = async (req, res) => {
  try {
    const cancelRequests = await Booking.find({ cancelStatus: "pending" })
      .populate("user", "name email")
      .populate("package", "name duration")
      .populate("driver")
      .sort({ createdAt: -1 });

    const cancelRequestsWithPayment = await Promise.all(
      cancelRequests.map(async (b) => {
        const payment = await Payment.findOne({ booking: b._id }).sort({
          createdAt: -1,
        });

        let mappedPaymentStatus = b.paymentStatus;
        if (payment) {
          if (payment.status === "success") mappedPaymentStatus = "paid";
          else if (payment.status === "created") mappedPaymentStatus = "pending";
          else if (payment.status === "failed") mappedPaymentStatus = "failed";
          else if (payment.status === "refunded") mappedPaymentStatus = "refunded";
        }

        // Calculate dynamic refund details based on timeline policy
        const travelDate = new Date(b.travelStartDate);
        const today = new Date();
        const diffTime = travelDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let refundPercent = 0;
        if (diffDays >= 30) refundPercent = 90;
        else if (diffDays >= 15) refundPercent = 50;
        else if (diffDays >= 7) refundPercent = 25;
        else refundPercent = 0;

        const eligibleRefund = (Number(b.totalAmount) * refundPercent) / 100;

        return {
          ...b.toObject(),
          paymentStatus: mappedPaymentStatus,
          refundStatus: payment?.refundStatus || b.refund_status || "none",
          refundAmount: payment?.refundAmount || b.refund_amount || 0,
          eligibleRefund,
          refundPercent,
          diffDays
        };
      })
    );

    return res.status(200).json(cancelRequestsWithPayment);
  } catch (error) {
    console.error("ADMIN CANCEL REQUESTS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Confirm booking
export const confirmBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.bookingStatus = "confirmed";
    await booking.save();

    // Automatically send confirmation email
    try {
      await sendInvoiceEmailHelper(booking._id);
    } catch (err) {
      console.error("[Admin Confirm] Failed to send email invoice:", err);
    }

    return res.status(200).json({
      message: "Booking Confirmed ✅",
      booking,
    });
  } catch (error) {
    console.error("ADMIN CONFIRM ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Unconfirm booking
export const unconfirmBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.bookingStatus = "pending";
    await booking.save();

    return res.status(200).json({
      message: "Booking moved back to Pending ✅",
      booking,
    });
  } catch (error) {
    console.error("ADMIN UNCONFIRM ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Update Booking Status & Payment Status
export const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingStatus, paymentStatus } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (bookingStatus) {
      booking.bookingStatus = bookingStatus;
    }
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;

      // Sync Payment record associated with this booking
      let payment = await Payment.findOne({ booking: id });
      if (paymentStatus === "paid") {
        if (!payment) {
          payment = new Payment({
            user: booking.user,
            booking: booking._id,
            amount: booking.totalAmount,
            status: "success",
            razorpayOrderId: "CASH_BOOKING",
            razorpayPaymentId: "CASH_PAYMENT_" + Date.now(),
          });
        } else {
          payment.status = "success";
        }
        await payment.save();

        // Dispatch a confirmation email to the user with a Booking Receipt PDF attachment
        try {
          await sendInvoiceEmailHelper(booking._id);
        } catch (err) {
          console.error("[Admin Payment Status Update] Failed to send confirmation receipt email:", err);
        }
      } else if (paymentStatus === "pending") {
        if (payment) {
          payment.status = "created";
          await payment.save();
        }
      } else if (paymentStatus === "failed") {
        if (payment) {
          payment.status = "failed";
          await payment.save();
        }
      } else if (paymentStatus === "refunded") {
        if (payment) {
          payment.status = "refunded";
          payment.refundStatus = "refunded";
          await payment.save();
        }
        booking.refund_status = "processed";
      }
    }
    
    await booking.save();

    return res.status(200).json({
      message: "Booking updated successfully ✅",
      booking,
    });
  } catch (error) {
    console.error("ADMIN UPDATE STATUS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Resend invoice email manually
export const resendInvoiceEmailAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await sendInvoiceEmailHelper(bookingId);
    if (result.success) {
      return res.status(200).json({ message: "Invoice email resent successfully ✅" });
    } else {
      return res.status(500).json({ message: result.error || "Failed to resend invoice email" });
    }
  } catch (error) {
    console.error("ADMIN RESEND EMAIL ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
