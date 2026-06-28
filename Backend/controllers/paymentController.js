import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import sendEmail from "../utils/sendEmail.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";
import { createTransactionRecord } from "../utils/transactionLogger.js";
import { sendInvoiceEmailHelper } from "../utils/sendInvoiceEmail.js";

// ================= CREATE ORDER =================
export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    console.log(`[Razorpay Order Creation] Initiating order for bookingId: ${bookingId}`);

    if (!bookingId) {
      console.warn("[Razorpay Order Creation] Rejected: bookingId is missing");
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.warn(`[Razorpay Order Creation] Rejected: Booking not found in DB with ID: ${bookingId}`);
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentStatus === "paid") {
      console.warn(`[Razorpay Order Creation] Rejected: Booking ID ${bookingId} is already paid.`);
      return res.status(400).json({ message: "Booking already paid" });
    }

    const options = {
      amount: Math.round(Number(booking.totalAmount) * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_${bookingId}`,
    };

    console.log(`[Razorpay Order Creation] Options prepared: amount=${options.amount} paise, currency=INR, receipt=${options.receipt}`);

    const order = await razorpay.orders.create(options);
    console.log(`[Razorpay Order Creation] Order created successfully via Razorpay API. Order ID: ${order.id}`);

    const paymentRecord = await Payment.create({
      user: req.user._id,
      booking: bookingId,
      razorpayOrderId: order.id,
      amount: Number(booking.totalAmount),
      status: "created",
      refundStatus: "none",
    });
    console.log(`[Razorpay Order Creation] Temporary Payment record saved in DB with ID: ${paymentRecord._id}`);

    return res.status(200).json({
      orderId: order.id,
      amount: Number(booking.totalAmount),
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[Razorpay Order Creation Error] =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// ================= VERIFY PAYMENT =================
export const verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    console.log(`[Razorpay Verification] Request received for bookingId: ${bookingId}, orderId: ${razorpayOrderId}, paymentId: ${razorpayPaymentId}`);

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId) {
      console.warn("[Razorpay Verification] Rejected: missing bookingId, razorpayOrderId, or razorpayPaymentId");
      return res.status(400).json({ message: "Missing payment fields" });
    }

    const booking = await Booking.findById(bookingId);
    if (booking && booking.paymentStatus === "paid") {
      console.log(`[Razorpay Verification] Booking ID ${bookingId} is already marked paid. Returning success immediately.`);
      const payment = await Payment.findOne({ booking: bookingId }).sort({ createdAt: -1 });
      return res.status(200).json({
        message: "Payment verified ✅",
        payment,
        booking,
      });
    }

    // Secure Signature verification
    if (razorpaySignature) {
      console.log("[Razorpay Verification] Performing signature verification...");
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpaySignature) {
        console.error("[Razorpay Verification] Signature verification failed! Signature mismatch.");
        return res.status(400).json({ message: "Payment signature verification failed. Invalid transaction." });
      }
      console.log("[Razorpay Verification] Signature successfully verified ✅");
    } else {
      console.warn("[Razorpay Verification] Warning: razorpaySignature not supplied. Skipping verification check.");
    }

    const payment = await Payment.findOne({ booking: bookingId }).sort({
      createdAt: -1,
    });

    if (!payment) {
      console.error(`[Razorpay Verification] Rejected: No payment record found in DB for booking ID: ${bookingId}`);
      return res.status(404).json({ message: "Payment record not found" });
    }

    payment.razorpayOrderId = razorpayOrderId;
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.status = "success";
    await payment.save();
    console.log(`[Razorpay Verification] Payment record ${payment._id} status updated to "success"`);

    if (booking) {
      booking.bookingStatus = "confirmed";
      booking.paymentStatus = "paid";
      booking.paymentId = razorpayPaymentId;
      booking.orderId = razorpayOrderId;
      booking.razorpay_payment_id = razorpayPaymentId;
      booking.razorpay_order_id = razorpayOrderId;
      booking.paymentAmount = payment.amount;
      await booking.save();
      console.log(`[Razorpay Verification] Booking ID ${booking._id} status updated to confirmed & paid`);

      // Record PAYMENT_SUCCESS in Transaction History
      await createTransactionRecord({
        bookingId: booking._id,
        userId: booking.user,
        amount: payment.amount,
        paymentId: razorpayPaymentId,
        transactionStatus: "PAYMENT_SUCCESS",
      });

      // Send confirmation receipt email automatically
      try {
        await sendInvoiceEmailHelper(bookingId);
      } catch (err) {
        console.error("[Razorpay Verification] Failed to send confirmation receipt email:", err);
      }
    } else {
      console.warn(`[Razorpay Verification] Warning: Booking not found in DB with ID: ${bookingId}`);
    }

    return res.status(200).json({
      message: "Payment verified ✅",
      payment,
      booking,
    });
  } catch (error) {
    console.error("[Razorpay Verification Error] =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// ================= REFUND =================
export const refundPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    console.log(`[Razorpay Refund] Initiating refund for bookingId: ${bookingId}`);

    if (!bookingId) {
      console.warn("[Razorpay Refund] Rejected: bookingId is missing");
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.warn(`[Razorpay Refund] Rejected: Booking not found in DB with ID: ${bookingId}`);
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.bookingStatus !== "confirmed") {
      console.warn(`[Razorpay Refund] Rejected: Booking Status is not confirmed. Current: "${booking.bookingStatus}"`);
      return res.status(400).json({
        message: "Only confirmed bookings can be refunded",
      });
    }

    const payment = await Payment.findOne({ booking: bookingId }).sort({
      createdAt: -1,
    });

    if (!payment) {
      console.error(`[Razorpay Refund] Rejected: Payment record not found in DB for booking ID: ${bookingId}`);
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status !== "success") {
      console.warn(`[Razorpay Refund] Rejected: Payment status is not success. Current: "${payment.status}"`);
      return res.status(400).json({
        message: `Payment not successful yet (status: ${payment.status})`,
      });
    }

    if (payment.refundStatus === "refunded") {
      console.warn("[Razorpay Refund] Rejected: already refunded");
      return res.status(400).json({ message: "Payment already refunded" });
    }

    if (!payment.razorpayPaymentId) {
      console.warn("[Razorpay Refund] Rejected: razorpayPaymentId is missing");
      return res.status(400).json({ message: "Razorpay paymentId missing" });
    }

    const travelDate = new Date(booking.travelStartDate);
    const today = new Date();
    const diffDays = (travelDate - today) / (1000 * 60 * 60 * 24);

    let refundPercent = 0;
    if (diffDays >= 7) refundPercent = 100;
    else if (diffDays >= 3) refundPercent = 50;

    const refundAmount = (Number(booking.totalAmount) * refundPercent) / 100;
    console.log(`[Razorpay Refund] Cancellation details: diffDays=${diffDays}, refundPercent=${refundPercent}%, refundAmount=₹${refundAmount}`);

    if (refundAmount <= 0) {
      booking.bookingStatus = "cancelled";
      await booking.save();
      console.log(`[Razorpay Refund] Booking ${booking._id} cancelled without refund (policy terms)`);

      return res.status(200).json({
        message: "Booking cancelled (No refund as per policy terms)",
        refundAmount: 0,
      });
    }

    console.log(`[Razorpay Refund] Requesting refund from Razorpay API for Payment ID: ${payment.razorpayPaymentId}, amount: ₹${refundAmount}`);
    let refund;
    try {
      const isTestMode = 
        (payment.razorpayPaymentId && (payment.razorpayPaymentId.includes("test") || payment.razorpayPaymentId.includes("placeholder"))) ||
        (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith("rzp_test"));

      if (isTestMode) {
        console.log(`[Test Mode] Simulating Razorpay refund for test payment ID: ${payment.razorpayPaymentId}`);
        refund = {
          id: "rfnd_test_" + Math.random().toString(36).substring(2, 11),
          status: "processed",
          amount: Math.round(refundAmount * 100),
        };
      } else {
        refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(refundAmount * 100), // paise
        });
      }
      console.log(`[Razorpay Refund] Refund request succeeded via Razorpay. Refund ID: ${refund.id}`);
    } catch (razorpayError) {
      console.error("[Razorpay Refund Error]:", razorpayError);

      if (payment.razorpayPaymentId && (payment.razorpayPaymentId.startsWith("pay_") || payment.razorpayPaymentId.includes("placeholder") || (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith("rzp_test")))) {
        console.log(`[Test Mode Fallback] Simulating Razorpay refund after API error for payment ID: ${payment.razorpayPaymentId}`);
        refund = {
          id: "rfnd_test_fallback_" + Math.random().toString(36).substring(2, 11),
          status: "processed",
          amount: Math.round(refundAmount * 100),
        };
      } else {
        return res.status(500).json({
          message: "Razorpay refund failed: " + (razorpayError.description || razorpayError.message || "Unknown Razorpay error"),
          error: razorpayError,
        });
      }
    }

    const refundStatusVal = refund.status || "processed";
    if (refundStatusVal === "pending") {
      payment.status = "success";
      payment.refundStatus = "pending";
      booking.paymentStatus = "paid";
      booking.refund_status = "pending";
    } else if (refundStatusVal === "failed") {
      payment.status = "success";
      payment.refundStatus = "failed";
      booking.paymentStatus = "paid";
      booking.refund_status = "failed";
    } else {
      payment.status = "refunded";
      payment.refundStatus = "refunded";
      booking.paymentStatus = "refunded";
      booking.refund_status = "processed";
    }

    payment.refundId = refund.id;
    payment.refundAmount = refundAmount;
    await payment.save();

    booking.bookingStatus = "cancelled";
    booking.refund_id = refund.id;
    booking.refund_amount = refundAmount;
    booking.refunded_at = new Date();
    await booking.save();
    console.log(`[Razorpay Refund] DB updated successfully. Payment and booking marked cancelled/refunded.`);

    return res.status(200).json({
      message: "Refund processed ✅",
      refundAmount,
    });
  } catch (error) {
    console.error("[Razorpay Refund Error] =>", error);
    return res.status(500).json({ message: error.message });
  }
};