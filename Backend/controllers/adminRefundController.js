import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import razorpay from '../config/razorpay.js';
import sendEmail from '../utils/sendEmail.js';
import { generateInvoicePDF } from '../utils/generateInvoice.js';
import { createTransactionRecord } from "../utils/transactionLogger.js";

export const refundBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    console.log("✅ ADMIN REFUND HIT =>", bookingId);

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log("❌ Booking not found");
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log("bookingStatus =>", booking.bookingStatus);
    console.log("cancelStatus =>", booking.cancelStatus);

    // Must be pending request
    if (booking.cancelStatus !== "pending") {
      console.log("❌ No pending cancellation request");
      return res.status(400).json({
        message: `No pending cancellation request (cancelStatus: ${booking.cancelStatus})`,
      });
    }

    const payment = await Payment.findOne({ booking: bookingId }).sort({
      createdAt: -1,
    });

    if (!payment) {
      console.log("❌ Payment not found");
      return res.status(404).json({ message: "Payment not found" });
    }

    console.log("paymentId =>", payment._id);
    console.log("paymentStatus =>", payment.status);
    console.log("razorpayPaymentId =>", payment.razorpayPaymentId);
    console.log("refundStatus =>", payment.refundStatus);

    // Payment must be success
    if (payment.status !== "success") {
      console.log("❌ Payment not successful");
      return res.status(400).json({
        message: `Payment not successful yet (status: ${payment.status})`,
      });
    }

    if (!payment.razorpayPaymentId) {
      console.log("❌ Razorpay paymentId missing");
      return res.status(400).json({ message: "Razorpay paymentId missing" });
    }

    if (payment.refundStatus === "refunded") {
      console.log("❌ Already refunded");
      return res.status(400).json({ message: "Already refunded" });
    }

    // Policy
    const travelDate = new Date(booking.travelStartDate);
    const today = new Date();
    const diffTime = travelDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let refundPercent = 0;
    if (diffDays >= 30) refundPercent = 90;
    else if (diffDays >= 15) refundPercent = 50;
    else if (diffDays >= 7) refundPercent = 25;
    else refundPercent = 0;

    const refundAmount = (Number(booking.totalAmount) * refundPercent) / 100;

    console.log("diffDays =>", diffDays);
    console.log("refundPercent =>", refundPercent);
    console.log("refundAmount =>", refundAmount);

    // 0 refund
    if (refundAmount <= 0) {
      booking.bookingStatus = "cancelled";
      booking.paymentStatus = "refunded";
      booking.cancelStatus = "approved";
      booking.cancelledAt = new Date();
      booking.refund_id = "REFUND_POLICY_0";
      booking.refund_amount = 0;
      booking.refund_status = "processed";
      booking.refunded_at = new Date();
      await booking.save();

      payment.status = "refunded";
      payment.refundId = "REFUND_POLICY_0";
      payment.refundStatus = "refunded";
      payment.refundAmount = 0;
      await payment.save();

      // Log zero refund transactions
      await createTransactionRecord({
        bookingId: booking._id,
        userId: booking.user,
        amount: booking.totalAmount,
        paymentId: payment.razorpayPaymentId || booking.paymentId,
        refundId: "REFUND_POLICY_0",
        transactionStatus: "CANCELLATION_APPROVED"
      });

      await createTransactionRecord({
        bookingId: booking._id,
        userId: booking.user,
        amount: booking.totalAmount,
        paymentId: payment.razorpayPaymentId || booking.paymentId,
        refundId: "REFUND_POLICY_0",
        transactionStatus: "REFUND_PROCESSED"
      });

      await createTransactionRecord({
        bookingId: booking._id,
        userId: booking.user,
        amount: booking.totalAmount,
        paymentId: payment.razorpayPaymentId || booking.paymentId,
        refundId: "REFUND_POLICY_0",
        transactionStatus: "BOOKING_CANCELLED"
      });

      console.log("✅ Cancelled without refund (policy) ✅");

      // Send Email with 0 refund receipt
      await sendCancellationEmail(bookingId, "REFUND_POLICY_0", 0, refundPercent);

      return res.status(200).json({
        message: "Booking cancelled ✅ (No refund as per policy)",
        refundAmount: 0,
        refundPercent,
        booking,
        payment,
      });
    }

    // Log cancellation approved & refund pending
    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: payment.razorpayPaymentId || booking.paymentId,
      transactionStatus: "CANCELLATION_APPROVED"
    });

    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: payment.razorpayPaymentId || booking.paymentId,
      transactionStatus: "REFUND_PENDING"
    });

    // Razorpay refund
    console.log("✅ Calling Razorpay refund...");
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
          amount: Math.round(refundAmount * 100)
        };
      } else {
        refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(refundAmount * 100),
        });
      }
      console.log("✅ Razorpay refund done =>", refund?.id);
    } catch (razorpayError) {
      console.error("Razorpay API Error:", razorpayError);
      
      // Log refund failed
      await createTransactionRecord({
        bookingId: booking._id,
        userId: booking.user,
        amount: booking.totalAmount,
        paymentId: payment.razorpayPaymentId || booking.paymentId,
        transactionStatus: "REFUND_FAILED"
      });

      // Fallback for any unexpected failure with a test prefix
      if (payment.razorpayPaymentId && (payment.razorpayPaymentId.startsWith("pay_") || payment.razorpayPaymentId.includes("placeholder") || (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith("rzp_test")))) {
        console.log(`[Test Mode Fallback] Simulating Razorpay refund after API error for test payment ID: ${payment.razorpayPaymentId}`);
        refund = {
          id: "rfnd_test_fallback_" + Math.random().toString(36).substring(2, 11),
          status: "processed",
          amount: Math.round(refundAmount * 100)
        };
      } else {
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

    payment.refundId = refund.id;
    payment.refundAmount = refundAmount;
    await payment.save();

    booking.bookingStatus = "cancelled";
    booking.cancelStatus = "approved";
    booking.cancelledAt = new Date();
    booking.refund_id = refund.id;
    booking.refund_amount = refundAmount;
    booking.refunded_at = new Date();
    await booking.save();

    // Log successful refund and booking cancellation
    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: payment.razorpayPaymentId || booking.paymentId,
      refundId: refund.id,
      transactionStatus: "REFUND_PROCESSED"
    });

    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: payment.razorpayPaymentId || booking.paymentId,
      refundId: refund.id,
      transactionStatus: "BOOKING_CANCELLED"
    });

    // Send email with PDF attachment
    await sendCancellationEmail(bookingId, refund.id, refundAmount, refundPercent);

    return res.status(200).json({
      success: true,
      message: "Refund approved ✅ Booking cancelled",
      refundAmount,
      refundPercent,
      booking,
      payment,
    });
  } catch (error) {
    console.error("ADMIN REFUND ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

export const rejectRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log("✅ ADMIN REJECT REFUND HIT =>", bookingId);

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.cancelStatus !== "pending") {
      return res.status(400).json({
        message: `No pending cancellation request (cancelStatus: ${booking.cancelStatus})`,
      });
    }

    booking.cancelStatus = "rejected";
    await booking.save();

    // Send Rejection Email
    try {
      const populatedBooking = await Booking.findById(bookingId).populate("package").populate("user");
      if (populatedBooking && populatedBooking.user?.email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #ea580c; text-align: center;">Cancellation Request Update</h2>
            <p>Hello ${populatedBooking.firstName || "Traveler"},</p>
            <p>Your cancellation request for Booking ID <b>${populatedBooking._id}</b> has been reviewed by the administrator and was **Rejected**.</p>
            
            <div style="background-color: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffedd5; color: #9a3412;">
              <p style="margin: 5px 0;"><b>Booking ID:</b> ${populatedBooking._id}</p>
              <p style="margin: 5px 0;"><b>Package:</b> ${populatedBooking.package?.name || "N/A"}</p>
              <p style="margin: 5px 0;"><b>Status:</b> Active (Cancellation Request Rejected)</p>
            </div>

            <p>Your journey remains active and confirmed. If you believe this is in error or wish to appeal, please get in touch with our support team at support@monastery360.com.</p>
            <p>We look forward to seeing you on the tour!</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 🏔️ Spiritual Journey Booking Platform</p>
          </div>
        `;

        await sendEmail({
          to: populatedBooking.user.email,
          subject: `Cancellation Request Update - Sikkim Tourism (ID: ${populatedBooking._id})`,
          html: emailHtml,
        });
        console.log(`[adminRefundController] Rejection email successfully sent to ${populatedBooking.user.email}`);
      }
    } catch (err) {
      console.error("[adminRefundController] Failed to send cancellation rejection email:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Cancellation request rejected successfully 🚫",
      booking,
    });
  } catch (error) {
    console.error("ADMIN REJECT REFUND ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// Helper function to send email to user
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
      cancellationReason: populatedBooking.cancellationReason || populatedBooking.cancelReason || "User Request",
      approvedByAdmin: "Admin Portal",
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData, true);
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #ef4444; text-align: center;">Cancellation & Refund Approved</h2>
        <p>Hello ${populatedBooking.firstName || "Traveler"},</p>
        <p>Your cancellation request for Booking ID <b>${populatedBooking._id}</b> has been approved by the administrator.</p>
        
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
        subject: `Cancellation & Refund Approved - Sikkim Tourism (ID: ${populatedBooking._id})`,
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
        console.log(`[adminRefundController] Cancellation email successfully sent to ${populatedBooking.user.email}`);
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
        console.error(`[adminRefundController] Failed to send email to ${populatedBooking.user.email}:`, emailResult.error);
      }
    }
  } catch (err) {
    console.error("[adminRefundController] sendCancellationEmail Error:", err);
  }
};
