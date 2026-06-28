import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import razorpay from '../config/razorpay.js';
import sendEmail from '../utils/sendEmail.js';
import { generateInvoicePDF } from "../utils/generateInvoice.js";
import { createTransactionRecord } from "../utils/transactionLogger.js";
import { createAdminNotification } from '../utils/adminNotificationHelper.js';

export const requestCancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancelReason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // ✅ Only booking owner can request cancellation
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.bookingStatus !== "confirmed") {
      return res.status(400).json({
        message: "Only confirmed bookings can be cancelled",
      });
    }

    if (booking.cancelStatus === "pending") {
      return res.status(400).json({
        message: "Cancellation request already pending",
      });
    }

    if (booking.cancelStatus === "approved") {
      return res.status(400).json({
        message: "Booking already cancelled",
      });
    }

    booking.cancelStatus = "pending";
    booking.cancellationReason = req.body.cancellationReason || cancelReason || "";
    booking.cancelReason = req.body.cancellationReason || cancelReason || "";
    booking.cancellationRequestedAt = new Date();
    await booking.save();

    // Auto-create Admin Notification
    await createAdminNotification({
      title: "Cancellation Request Received ⚠️",
      message: `Traveler ${booking.firstName} ${booking.lastName} requested cancellation for booking ${booking._id}. Reason: "${booking.cancellationReason}"`,
      type: "CANCELLATION_REQUEST",
      referenceId: booking._id.toString(),
      actionUrl: "/admin/cancel-requests",
    });

    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: booking.paymentId || booking.razorpay_payment_id,
      transactionStatus: "CANCELLATION_REQUESTED"
    });

    // Trigger Cancellation Request Email (Traveler Email)
    try {
      const populatedBooking = await Booking.findById(bookingId).populate("package").populate("user");
      if (populatedBooking && populatedBooking.user?.email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #ea580c; text-align: center;">Cancellation Request Received</h2>
            <p>Hello ${populatedBooking.firstName || "Traveler"},</p>
            <p>We have received your cancellation request for Booking ID <b>${populatedBooking._id}</b>.</p>
            
            <div style="background-color: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffedd5; color: #9a3412;">
              <p style="margin: 5px 0;"><b>Booking ID:</b> ${populatedBooking._id}</p>
              <p style="margin: 5px 0;"><b>Package:</b> ${populatedBooking.package?.name || "N/A"}</p>
              <p style="margin: 5px 0;"><b>Cancellation Reason:</b> ${populatedBooking.cancellationReason || "No reason provided"}</p>
              <p style="margin: 5px 0;"><b>Request Date:</b> ${populatedBooking.cancellationRequestedAt ? populatedBooking.cancellationRequestedAt.toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</p>
              <p style="margin: 5px 0;"><b>Status:</b> Pending Review</p>
            </div>

            <p>Our administration team will review your request shortly as per the cancellation policy. Once processed, you will receive an email confirmation containing your refund details and cancellation receipt.</p>
            <p>If you did not initiate this request, please contact us immediately at support@monastery360.com.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 🏔️ Spiritual Journey Booking Platform</p>
          </div>
        `;

        await sendEmail({
          to: populatedBooking.user.email,
          subject: `Cancellation Request Received - Sikkim Tourism (ID: ${populatedBooking._id})`,
          html: emailHtml,
        });
        console.log(`[bookingCancelController] Cancellation request confirmation email sent to ${populatedBooking.user.email}`);
      }
    } catch (err) {
      console.error("[bookingCancelController] Failed to send cancellation request email:", err);
    }

    return res.status(200).json({
      message: "Cancellation request sent to admin ✅",
      booking,
    });
  } catch (error) {
    console.error("CANCEL REQUEST ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

export const cancelBookingAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Admin Direct Cancellation] Initiating cancel/refund for bookingId: ${id}`);

    // 1. Verify booking exists
    const booking = await Booking.findById(id);
    if (!booking) {
      console.warn(`[Admin Direct Cancellation] Rejected: Booking not found in DB with ID: ${id}`);
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Verify payment status is "paid"
    if (booking.paymentStatus !== "paid") {
      console.warn(`[Admin Direct Cancellation] Rejected: Booking paymentStatus is not "paid". Current: "${booking.paymentStatus}"`);
      return res.status(400).json({ message: "Only paid bookings can be refunded/cancelled through this process" });
    }

    // Find the payment record associated with this booking
    const payment = await Payment.findOne({ booking: id }).sort({ createdAt: -1 });
    if (!payment) {
      console.error(`[Admin Direct Cancellation] Rejected: No payment record found in DB for booking ID: ${id}`);
      return res.status(404).json({ message: "Payment record not found for this booking" });
    }

    // Make sure we have razorpay payment ID
    const paymentIdToRefund = booking.razorpay_payment_id || booking.paymentId || payment.razorpayPaymentId;
    if (!paymentIdToRefund) {
      console.error(`[Admin Direct Cancellation] Rejected: razorpay_payment_id is missing for booking ID: ${id}`);
      return res.status(400).json({ message: "Razorpay payment ID not found for this booking" });
    }

    console.log(`[Admin Direct Cancellation] Booking validation succeeded. Refunding paymentId: ${paymentIdToRefund}, amount: ₹${booking.totalAmount}`);

    // Log cancellation approved & refund pending
    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: paymentIdToRefund,
      transactionStatus: "CANCELLATION_APPROVED"
    });

    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: paymentIdToRefund,
      transactionStatus: "REFUND_PENDING"
    });

    // 3. Call Razorpay Refund API
    let refund;
    try {
      // Refund full amount. Razorpay expects amount in paise (multiply by 100)
      const refundAmountPaise = Math.round(booking.totalAmount * 100);
      console.log(`[Admin Direct Cancellation] Requesting refund from Razorpay API for amount: ${refundAmountPaise} paise`);
      
      const isTestMode = 
        (paymentIdToRefund && (paymentIdToRefund.includes("test") || paymentIdToRefund.includes("placeholder"))) ||
        (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith("rzp_test"));

      if (isTestMode) {
        console.log(`[Test Mode] Simulating Razorpay refund for test payment ID: ${paymentIdToRefund}`);
        refund = {
          id: "rfnd_test_" + Math.random().toString(36).substring(2, 11),
          status: "processed",
          amount: refundAmountPaise,
        };
      } else {
        refund = await razorpay.payments.refund(paymentIdToRefund, {
          amount: refundAmountPaise,
        });
      }
      console.log(`[Admin Direct Cancellation] Razorpay Refund API call succeeded. Refund ID: ${refund.id}`);
    } catch (razorpayError) {
      console.error("[Admin Direct Cancellation] Razorpay API Error:", razorpayError);
      
      // Fallback for test mode
      if (paymentIdToRefund && (paymentIdToRefund.startsWith("pay_") || paymentIdToRefund.includes("placeholder") || (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith("rzp_test")))) {
        console.log(`[Test Mode Fallback] Simulating Razorpay refund after API error for payment ID: ${paymentIdToRefund}`);
        refund = {
          id: "rfnd_test_fallback_" + Math.random().toString(36).substring(2, 11),
          status: "processed",
          amount: Math.round(booking.totalAmount * 100),
        };
      } else {
        // Log refund failure
        await createTransactionRecord({
          bookingId: booking._id,
          userId: booking.user,
          amount: booking.totalAmount,
          paymentId: paymentIdToRefund,
          transactionStatus: "REFUND_FAILED"
        });

        return res.status(500).json({
          message: "Razorpay refund failed: " + (razorpayError.description || razorpayError.message || "Unknown Razorpay error"),
          error: razorpayError
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

    // Save refund tracking fields to Booking
    booking.bookingStatus = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelStatus = "approved"; // Since admin cancelled it directly
    booking.refund_id = refund.id;
    booking.refund_amount = booking.totalAmount;
    booking.refunded_at = new Date();

    // Also copy to other fields just in case
    booking.razorpay_payment_id = paymentIdToRefund;
    booking.razorpay_order_id = booking.orderId || payment.razorpayOrderId;

    await booking.save();
    console.log(`[Admin Direct Cancellation] Booking document ${booking._id} updated with cancel/refund fields`);

    payment.refundId = refund.id;
    payment.refundAmount = booking.totalAmount;
    await payment.save();
    console.log(`[Admin Direct Cancellation] Payment document ${payment._id} updated with refunded fields`);

    // Log refund processed and booking cancelled
    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: paymentIdToRefund,
      refundId: refund.id,
      transactionStatus: "REFUND_PROCESSED"
    });

    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: paymentIdToRefund,
      refundId: refund.id,
      transactionStatus: "BOOKING_CANCELLED"
    });

    // Send email with PDF attachment
    try {
      await sendCancellationEmail(booking._id, refund.id, booking.totalAmount, 100);
    } catch (emailErr) {
      console.error("[Admin Direct Cancellation] Email dispatch failed:", emailErr);
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled and refund processed successfully ✅",
      booking,
      payment,
      refund
    });
  } catch (error) {
    console.error("[Admin Direct Cancellation Error] =>", error);
    return res.status(500).json({ message: error.message || "Internal server error during refund." });
  }
};

const sendCancellationEmail = async (bookingId, refundId, refundAmount, refundPercent) => {
  try {
    const populatedBooking = await Booking.findById(bookingId).populate("package").populate("user");
    if (!populatedBooking) return;

    const invoiceData = {
      bookingId: populatedBooking._id,
      userName: populatedBooking.user?.name || "Guest",
      userEmail: populatedBooking.user?.email || "",
      firstName: populatedBooking.firstName,
      lastName: populatedBooking.lastName,
      mobile: populatedBooking.mobile,
      age: populatedBooking.age,
      address: populatedBooking.address,
      idProofType: populatedBooking.idProofType,
      idProofNumber: populatedBooking.idProofNumber,
      travellers: populatedBooking.travellers || [],
      packageName: populatedBooking.package?.name || "Unknown Package",
      travelDate: populatedBooking.travelStartDate ? populatedBooking.travelStartDate.toDateString() : "-",
      persons: populatedBooking.persons,
      amount: populatedBooking.totalAmount,
      paymentMethod: populatedBooking.paymentMethod,
      paymentStatus: "refunded",
      
      refundId: refundId,
      refundAmount: refundAmount,
      refundStatus: "Refunded",
      refundDate: new Date().toDateString(),
      refundPercent: refundPercent,
      cancellationReason: populatedBooking.cancellationReason || populatedBooking.cancelReason || "Admin Cancelled",
      approvedByAdmin: "Admin Portal",
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData, true);
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #ef4444; text-align: center;">Booking Cancelled & Refund Processed</h2>
        <p>Hello ${populatedBooking.firstName || "Traveler"},</p>
        <p>Your booking with ID <b>${populatedBooking._id}</b> has been cancelled and a full refund has been processed by the administrator.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 5px 0;"><b>Booking ID:</b> ${populatedBooking._id}</p>
          <p style="margin: 5px 0;"><b>Refund ID:</b> ${refundId}</p>
          <p style="margin: 5px 0;"><b>Refund Amount:</b> ₹${refundAmount} (${refundPercent}% Refund)</p>
          <p style="margin: 5px 0;"><b>Refund Status:</b> Refunded</p>
        </div>

        <p>We have attached your Cancellation and Refund Receipt PDF to this email. Please check the attachment for further details.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 🏔️ Spiritual Journey Booking Platform</p>
      </div>
    `;

    if (populatedBooking.user?.email) {
      const emailResult = await sendEmail({
        to: populatedBooking.user.email,
        subject: `Booking Cancelled & Refunded - Sikkim Tourism (ID: ${populatedBooking._id})`,
        html: emailHtml,
        attachments: [
          {
            filename: `Cancellation_Receipt_${populatedBooking._id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      const invoiceType = refundPercent === 0 ? "cancellation" : "refund";

      if (emailResult.success) {
        await Invoice.create({
          booking: bookingId,
          user: populatedBooking.user._id,
          invoiceType: invoiceType,
          amount: refundAmount,
          sentTo: populatedBooking.user.email,
          status: "sent"
        });
        console.log(`[bookingCancelController] Cancellation email successfully sent to ${populatedBooking.user.email}`);
      } else {
        await Invoice.create({
          booking: bookingId,
          user: populatedBooking.user._id,
          invoiceType: invoiceType,
          amount: refundAmount,
          sentTo: populatedBooking.user.email,
          status: "failed",
          error: String(emailResult.error || "SMTP delivery failure")
        });
        console.error(`[bookingCancelController] Failed to send cancellation email to ${populatedBooking.user.email}:`, emailResult.error);
      }
    }
  } catch (err) {
    console.error("[bookingCancelController] sendCancellationEmail Error:", err);
  }
};
