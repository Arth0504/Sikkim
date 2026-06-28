import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import sendEmail from './sendEmail.js';
import { generateInvoicePDF } from './generateInvoice.js';

export const sendInvoiceEmailHelper = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId).populate("package").populate("user");
    if (!booking) {
      console.error(`[Email Invoice] Booking ID ${bookingId} not found`);
      return { success: false, error: "Booking not found" };
    }
    if (!booking.user?.email) {
      console.error(`[Email Invoice] Traveler email is missing for Booking ID ${bookingId}`);
      return { success: false, error: "Traveler email missing" };
    }

    const invoiceData = {
      bookingId: booking._id,
      userName: booking.user.name || "Guest",
      userEmail: booking.user.email,
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
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData, false);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">Booking Confirmed! 🏔️</h2>
        <p>Hello ${booking.firstName || "Traveler"},</p>
        <p>Thank you for booking your spiritual journey with Monastery360. Your booking is confirmed and payment was successfully processed.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 5px 0;"><b>Booking ID:</b> ${booking._id}</p>
          <p style="margin: 5px 0;"><b>Package:</b> ${booking.package?.name || "N/A"}</p>
          <p style="margin: 5px 0;"><b>Travel Start Date:</b> ${booking.travelStartDate ? booking.travelStartDate.toLocaleDateString('en-IN') : "N/A"}</p>
          <p style="margin: 5px 0;"><b>Amount Paid:</b> ₹${booking.totalAmount}</p>
        </div>

        <p>We have attached your official booking receipt PDF to this email. Please keep it handy for your records.</p>
        <p style="font-weight: bold; color: #0d9488;">See you on the mountains! 🏔️</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 🏔️ Spiritual Journey Booking Platform</p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: booking.user.email,
      subject: `Booking Confirmed - Sikkim Tourism 🏔️ (ID: ${booking._id})`,
      html: emailHtml,
      attachments: [
        {
          filename: `Booking_Receipt_${booking._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    if (emailResult.success) {
      booking.emailSent = true;
      booking.emailSentAt = new Date();
      booking.invoiceSent = true;
      await booking.save();

      // Log invoice history
      await Invoice.create({
        booking: bookingId,
        user: booking.user._id,
        invoiceType: "booking_confirmation",
        amount: booking.totalAmount,
        sentTo: booking.user.email,
        status: "sent"
      });

      console.log(`[Email Invoice] Invoice email successfully sent to ${booking.user.email} for booking ${bookingId}`);
      return { success: true };
    } else {
      console.error(`[Email Invoice] Failed to send email to ${booking.user.email}:`, emailResult.error);
      
      // Log invoice history failure
      await Invoice.create({
        booking: bookingId,
        user: booking.user._id,
        invoiceType: "booking_confirmation",
        amount: booking.totalAmount,
        sentTo: booking.user.email,
        status: "failed",
        error: String(emailResult.error || "SMTP delivery failure")
      });

      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    console.error(`[Email Invoice] Error helper execution:`, error);
    try {
      const b = await Booking.findById(bookingId);
      if (b) {
        await Invoice.create({
          booking: bookingId,
          user: b.user,
          invoiceType: "booking_confirmation",
          amount: b.totalAmount,
          sentTo: "Unknown",
          status: "failed",
          error: error.message
        });
      }
    } catch (dbErr) {
      console.error("Failed to write invoice error log:", dbErr);
    }
    return { success: false, error: error.message };
  }
};
