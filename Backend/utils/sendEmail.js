import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Startup validation for environment variables
if (!process.env.EMAIL_USER) {
  console.error("❌ [EMAIL] Startup Validation Failed: EMAIL_USER is missing in .env!");
} else {
  console.log(`[EMAIL] Startup Validation: EMAIL_USER is configured as ${process.env.EMAIL_USER}`);
}

if (!process.env.EMAIL_PASS) {
  console.error("❌ [EMAIL] Startup Validation Failed: EMAIL_PASS is missing in .env!");
} else {
  console.log("[EMAIL] Startup Validation: EMAIL_PASS is configured successfully.");
}

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("SMTP Authentication Failed: EMAIL_USER or EMAIL_PASS is missing in environment variables.");
    }
    
    transporter = nodemailer.createTransport({
      service: "gmail",
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error(`[EMAIL] SMTP connection pool verification failed: ${error.message}`);
      } else {
        console.log("[EMAIL] SMTP connection pool verified and ready to send emails instantly.");
      }
    });
  }
  return transporter;
};

const sendEmail = async (options) => {
  console.log("[EMAIL] Sending...");
  try {
    const activeTransporter = getTransporter();

    // Backward compatibility for general inquiries
    let mailOptions;
    if (options.name && options.email && options.message) {
      mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `New Inquiry from ${options.name}`,
        html: `
          <h2>New Inquiry</h2>
          <p><b>Name:</b> ${options.name}</p>
          <p><b>Email:</b> ${options.email}</p>
          <p><b>Message:</b> ${options.message}</p>
        `,
      };
    } else {
      // General mailing structure
      mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || [],
      };
    }

    const info = await activeTransporter.sendMail(mailOptions);
    console.log("[EMAIL] Sent Successfully");
    console.log(`Email sent successfully to ${mailOptions.to}. Message ID: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error("[EMAIL] Failed");
    console.error(`Email failed to send. Error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export default sendEmail;