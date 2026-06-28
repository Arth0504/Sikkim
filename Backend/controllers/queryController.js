import Query from '../models/Query.js';
import sendEmail from '../utils/sendEmail.js';
import { createAdminNotification } from '../utils/adminNotificationHelper.js';

// Helper to generate a unique reference number: QUERY-XXXXX
const generateReferenceId = async () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let refId = '';
  while (!isUnique) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    refId = `QUERY-${code}`;
    const existing = await Query.findOne({ referenceId: refId });
    if (!existing) {
      isUnique = true;
    }
  }
  return refId;
};

// ✅ CREATE QUERY (User / Home page form)
export const createQuery = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const referenceId = await generateReferenceId();

    const query = await Query.create({
      name,
      email,
      phone,
      subject,
      message,
      referenceId,
      status: "NEW",
      isAdminRead: false,
      acknowledgementEmailStatus: "PENDING",
      timeline: [
        {
          status: "Query Created",
          timestamp: new Date(),
          notes: `Query submitted by user. Reference ID: ${referenceId}`,
        },
      ],
    });

    // Send acknowledgement email immediately to customer
    let ackStatus = "PENDING";
    const sentTimestamp = new Date();
    try {
      const ackEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0d9488; text-align: center;">Query Received Successfully</h2>
          <p>Hello ${name},</p>
          <p>Thank you for contacting us.</p>
          <p>Your query has been received.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #0f766e; font-weight: bold;">Reference ID: ${referenceId}</p>
          </div>
          
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Our support team has been notified and will review your query shortly. If you need to follow up, please reply to this email and keep the Reference ID intact.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 🏔️ Spiritual Journey Booking Platform</p>
        </div>
      `;

      const emailResult = await sendEmail({
        to: email,
        subject: "Query Received Successfully",
        html: ackEmailHtml,
      });

      if (emailResult && emailResult.success) {
        ackStatus = "DELIVERED";
        console.log(`[Query Controller] User acknowledgement email sent successfully.`);
      } else {
        ackStatus = "FAILED";
        console.error(`[Query Controller] User acknowledgement email failed to send: ${emailResult.error}`);
      }
    } catch (err) {
      ackStatus = "FAILED";
      console.error("[Query Controller] Failed to send acknowledgement email to customer:", err);
    }

    // Update query with acknowledgement status
    query.acknowledgementEmailStatus = ackStatus;
    query.acknowledgementEmailSentAt = sentTimestamp;
    await query.save();

    // Auto-create Admin Notification
    await createAdminNotification({
      title: "New Customer Query 💬",
      message: `New support query received from ${name} (Subject: "${subject}")`,
      type: "NEW_QUERY",
      referenceId: query._id.toString(),
      actionUrl: "/admin/queries",
    });

    // Send notification email to Admin
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0d9488; text-align: center;">New Customer Query Received</h2>
          <p>Hello Admin,</p>
          <p>You have received a new customer query from the Home Page Form (Ref: ${referenceId}):</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
            <p style="margin: 5px 0;"><b>Reference ID:</b> ${referenceId}</p>
            <p style="margin: 5px 0;"><b>Name:</b> ${name}</p>
            <p style="margin: 5px 0;"><b>Email:</b> ${email}</p>
            <p style="margin: 5px 0;"><b>Phone:</b> ${phone}</p>
            <p style="margin: 5px 0;"><b>Subject:</b> ${subject}</p>
            <p style="margin: 5px 0;"><b>Message:</b> ${message}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 🏔️ Spiritual Journey Booking Platform</p>
        </div>
      `;

      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `New Customer Query Received [${referenceId}]`,
        html: emailHtml,
      });
      console.log(`[Query Controller] Admin notification email sent successfully.`);
    } catch (err) {
      console.error("[Query Controller] Failed to send notification email to Admin:", err);
    }

    return res.status(201).json({
      message: `Your query has been submitted successfully with Reference ID: ${referenceId}. Our team will contact you within 24 hours.`,
      query,
    });
  } catch (error) {
    console.error("Create Query Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET ALL QUERIES (Admin with filter and search)
export const getAdminQueries = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: q },
        { email: q },
        { phone: q },
        { subject: q },
        { message: q },
        { referenceId: q },
      ];
    }

    const queries = await Query.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(queries);
  } catch (error) {
    console.error("Get Admin Queries Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET SINGLE QUERY (Admin - logs Admin Viewed if status is NEW)
export const getAdminQueryById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = await Query.findById(id);

    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    let updated = false;

    // Mark as read when admin views
    if (!query.isAdminRead) {
      query.isAdminRead = true;
      updated = true;
    }

    // Auto transition NEW -> IN_PROGRESS on view
    if (query.status === "NEW") {
      query.status = "IN_PROGRESS";
      query.timeline.push({
        status: "Admin Viewed",
        timestamp: new Date(),
        notes: "Admin opened and viewed the query details",
      });
      updated = true;
    }

    if (updated) {
      await query.save();
    }

    return res.status(200).json(query);
  } catch (error) {
    console.error("Get Admin Query By Id Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ REPLY TO QUERY (Admin - updates status to REPLIED and logs event)
export const replyAdminQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    const refId = query.referenceId || "N/A";
    let emailStatus = "PENDING";
    const replyTimestamp = new Date();

    // Send reply email to the customer
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0d9488; text-align: center;">Response to Your Inquiry</h2>
          <p>Hello ${query.name},</p>
          <p>Thank you for reaching out to us. We have reviewed your query and posted a response:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #0f766e; font-weight: bold;">Reference ID: ${refId}</p>
          </div>

          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #475569;"><b>Original Query (Subject: ${query.subject}):</b></p>
            <p style="margin: 5px 0; color: #64748b; font-style: italic;">"${query.message}"</p>
          </div>

          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #bbf7d0; color: #166534;">
            <p style="margin: 0;"><b>Admin Response:</b></p>
            <p style="margin: 5px 0; font-weight: bold;">"${reply}"</p>
          </div>
          
          <p>If you have any further questions, please reply directly to this email or drop us another inquiry. Always refer to your Reference ID: ${refId}.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 🏔️ Spiritual Journey Booking Platform</p>
        </div>
      `;

      const emailResult = await sendEmail({
        to: query.email,
        subject: `Response to Your Inquiry [Reference: ${refId}]`,
        html: emailHtml,
      });

      if (emailResult && emailResult.success) {
        emailStatus = "DELIVERED";
        console.log(`[Query Controller] Reply email sent successfully to ${query.email}`);
      } else {
        emailStatus = "FAILED";
        console.error(`[Query Controller] Reply email failed to send: ${emailResult.error}`);
      }
    } catch (err) {
      emailStatus = "FAILED";
      console.error("[Query Controller] Failed to send reply email to customer:", err);
    }

    // Append to reply history
    query.replies.push({
      message: reply,
      sender: "Admin",
      sentAt: replyTimestamp,
      emailStatus: emailStatus,
    });

    query.adminReply = reply; // backward compatibility
    query.status = "REPLIED";
    query.isAdminRead = true; // when admin replies, it's read
    
    query.timeline.push({
      status: "Admin Replied",
      timestamp: replyTimestamp,
      notes: `Reply sent. Email delivery: ${emailStatus}. Message snippet: ${reply.substring(0, 60)}${reply.length > 60 ? '...' : ''}`,
    });

    await query.save();

    return res.status(200).json({
      message: `Reply sent successfully and logged ✅ (Email status: ${emailStatus})`,
      query,
    });
  } catch (error) {
    console.error("Reply Query Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE QUERY STATUS (Admin - e.g. CLOSED)
export const updateAdminQueryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    const oldStatus = query.status;
    query.status = status;

    // Log the timeline event
    let timelineStatus = "Query Status Updated";
    if (status === "CLOSED") {
      timelineStatus = "Query Closed";
    }

    query.timeline.push({
      status: timelineStatus,
      timestamp: new Date(),
      notes: `Status changed from ${oldStatus} to ${status}`,
    });

    await query.save();

    return res.status(200).json({
      message: `Query status updated to ${status} successfully ✅`,
      query,
    });
  } catch (error) {
    console.error("Update Query Status Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ TOGGLE QUERY READ STATUS (Admin - manually marks read/unread)
export const toggleQueryReadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdminRead } = req.body;

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    // Toggle if not explicitly provided, otherwise set explicitly
    query.isAdminRead = typeof isAdminRead === 'boolean' ? isAdminRead : !query.isAdminRead;

    query.timeline.push({
      status: query.isAdminRead ? "Marked as Read" : "Marked as Unread",
      timestamp: new Date(),
      notes: `Admin manually updated read status to ${query.isAdminRead ? "Read" : "Unread"}`,
    });

    await query.save();

    return res.status(200).json({
      message: `Query marked as ${query.isAdminRead ? "Read" : "Unread"} ✅`,
      query,
    });
  } catch (error) {
    console.error("Toggle Query Read Status Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
