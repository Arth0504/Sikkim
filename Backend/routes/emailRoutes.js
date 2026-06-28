import express from "express";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  const result = await sendEmail(req.body);

  if (result.success) {
    res.status(200).json({ message: "Email sent successfully" });
  } else {
    res.status(500).json({ message: "Failed to send email" });
  }
});

// GET /api/test-email route
router.get("/test-email", async (req, res) => {
  const testOptions = {
    to: process.env.EMAIL_USER || "test@example.com",
    subject: "Monastery360 SMTP Test Email 🏔️",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">SMTP Test Successful! ✅</h2>
        <p>Hello,</p>
        <p>This is a test email sent from your Monastery360 application to verify that the Nodemailer transporter configuration and Gmail SMTP are working perfectly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 SMTP Configuration Check</p>
      </div>
    `,
  };

  console.log("[TEST EMAIL] Triggering test email dispatch...");
  const result = await sendEmail(testOptions);

  if (result.success) {
    res.status(200).json({
      success: true,
      message: "Test email sent successfully! Please check your inbox.",
      info: result.info,
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to send test email.",
      error: result.error,
    });
  }
});

export default router;