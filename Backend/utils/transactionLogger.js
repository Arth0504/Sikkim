import Transaction from "../models/Transaction.js";
import Booking from "../models/Booking.js";

export const createTransactionRecord = async ({
  bookingId,
  userId,
  packageName,
  amount,
  paymentId,
  refundId,
  transactionStatus,
}) => {
  try {
    let resolvedPackageName = packageName;
    let resolvedUserId = userId;
    let resolvedAmount = amount;
    let resolvedPaymentId = paymentId;
    let resolvedRefundId = refundId;

    if (bookingId && (!resolvedPackageName || !resolvedUserId || resolvedAmount === undefined)) {
      const booking = await Booking.findById(bookingId).populate("package");
      if (booking) {
        if (!resolvedPackageName && booking.package) {
          resolvedPackageName = booking.package.name;
        }
        if (!resolvedUserId) {
          resolvedUserId = booking.user;
        }
        if (resolvedAmount === undefined) {
          resolvedAmount = booking.totalAmount;
        }
        if (!resolvedPaymentId) {
          resolvedPaymentId = booking.paymentId || booking.razorpay_payment_id;
        }
        if (!resolvedRefundId) {
          resolvedRefundId = booking.refund_id;
        }
      }
    }

    const transaction = await Transaction.create({
      bookingId,
      userId: resolvedUserId,
      packageName: resolvedPackageName || "Spiritual Tour Package",
      amount: resolvedAmount || 0,
      paymentId: resolvedPaymentId || null,
      refundId: resolvedRefundId || null,
      transactionStatus,
    });

    console.log(`[Transaction Logger] Status '${transactionStatus}' saved for booking ${bookingId}`);
    return transaction;
  } catch (error) {
    console.error(`[Transaction Logger Error] Failed to log status '${transactionStatus}':`, error);
  }
};
