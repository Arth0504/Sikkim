import FestivalReminder from '../models/FestivalReminder.js';
import Festival from '../models/Festival.js';
import sendEmail from '../utils/sendEmail.js';
import { createAdminNotification } from '../utils/adminNotificationHelper.js';

// ✅ SUBSCRIBE TO REMINDERS
export const subscribeReminder = async (req, res) => {
  try {
    const { festivalId } = req.body;
    if (!festivalId) return res.status(400).json({ message: "Festival ID is required" });

    const festival = await Festival.findById(festivalId);
    if (!festival) return res.status(404).json({ message: "Festival not found" });

    // Find if a subscription already exists (either active or unsubscribed)
    let reminder = await FestivalReminder.findOne({ user: req.user._id, festival: festivalId });

    if (reminder) {
      if (reminder.subscribed) {
        return res.status(400).json({ message: "Already subscribed to reminders for this festival 🔔" });
      }
      reminder.subscribed = true;
      reminder.sentReminders = []; // Reset tracking for a resubscription
      await reminder.save();

      // Auto-create Admin Notification
      await createAdminNotification({
        title: "Festival Reminder Subscribed 🔔",
        message: `Traveler ${req.user.name} (${req.user.email}) resubscribed to reminders for festival "${festival.name}".`,
        type: "FESTIVAL_REMINDER",
        referenceId: reminder._id.toString(),
        actionUrl: "/admin/reminders",
      });

      return res.status(200).json({ message: "Resubscribed to festival reminders successfully! 🔔", reminder });
    }

    reminder = await FestivalReminder.create({
      user: req.user._id,
      festival: festivalId,
      email: req.user.email,
      subscribed: true,
    });

    // Auto-create Admin Notification
    await createAdminNotification({
      title: "Festival Reminder Subscribed 🔔",
      message: `Traveler ${req.user.name} (${req.user.email}) subscribed to reminders for festival "${festival.name}".`,
      type: "FESTIVAL_REMINDER",
      referenceId: reminder._id.toString(),
      actionUrl: "/admin/reminders",
    });

    return res.status(201).json({ message: "Subscribed to festival reminders successfully! 🔔", reminder });
  } catch (error) {
    console.error("SUBSCRIBE REMINDER ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UNSUBSCRIBE FROM REMINDERS
export const unsubscribeReminder = async (req, res) => {
  try {
    const { festivalId } = req.params;

    const reminder = await FestivalReminder.findOne({ user: req.user._id, festival: festivalId });
    if (!reminder || !reminder.subscribed) {
      return res.status(400).json({ message: "You are not subscribed to reminders for this festival." });
    }

    reminder.subscribed = false;
    await reminder.save();

    return res.status(200).json({ message: "Unsubscribed from festival reminders successfully! 🔕" });
  } catch (error) {
    console.error("UNSUBSCRIBE REMINDER ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET SUBSCRIPTION STATUS FOR A FESTIVAL
export const getSubscriptionStatus = async (req, res) => {
  try {
    const { festivalId } = req.params;
    const reminder = await FestivalReminder.findOne({ user: req.user._id, festival: festivalId });
    return res.status(200).json({ subscribed: reminder ? reminder.subscribed : false });
  } catch (error) {
    console.error("GET SUBSCRIPTION STATUS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: GET REMINDER STATS / LIST
export const getReminderStatsAdmin = async (req, res) => {
  try {
    const reminders = await FestivalReminder.find()
      .populate("user", "name email")
      .populate("festival", "name date month location")
      .sort({ createdAt: -1 });

    const totalSubscribers = await FestivalReminder.countDocuments({ subscribed: true });

    return res.status(200).json({ totalSubscribers, reminders });
  } catch (error) {
    console.error("GET REMINDER STATS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN/AUTO: TRIGGER REMINDERS (Checks dates and sends emails)
export const triggerReminders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeReminders = await FestivalReminder.find({ subscribed: true })
      .populate("festival")
      .populate("user", "name email");

    let emailsSentCount = 0;
    const results = [];

    for (const reminder of activeReminders) {
      if (!reminder.festival || !reminder.festival.date) continue;

      const festivalDate = new Date(reminder.festival.date);
      festivalDate.setHours(0, 0, 0, 0);

      const diffTime = festivalDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Standard intervals: 7, 3, or 1 days before
      if ([7, 3, 1].includes(diffDays)) {
        // Check if reminder for this interval has already been sent
        if (!reminder.sentReminders.includes(diffDays)) {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h2 style="color: #0d9488; text-align: center;">Festival Reminder! 🏔️</h2>
              <p>Hello ${reminder.user?.name || "Traveler"},</p>
              <p>This is a reminder that the festival <b>${reminder.festival.name}</b> is coming up in <b>${diffDays} day(s)</b>!</p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
                <p style="margin: 5px 0;"><b>Festival Name:</b> ${reminder.festival.name}</p>
                <p style="margin: 5px 0;"><b>Date:</b> ${new Date(reminder.festival.date).toLocaleDateString('en-IN')}</p>
                <p style="margin: 5px 0;"><b>Location:</b> ${reminder.festival.location || "Sikkim"}</p>
                <p style="margin: 5px 0;"><b>Month:</b> ${reminder.festival.month}</p>
              </div>

              <p><b>About the Festival:</b></p>
              <p>${reminder.festival.description}</p>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #64748b; text-align: center;">You received this email because you subscribed to reminders for this festival on Monastery360. To unsubscribe, please manage your preferences in the portal.</p>
            </div>
          `;

          const result = await sendEmail({
            to: reminder.email,
            subject: `Reminder: ${reminder.festival.name} in ${diffDays} day(s)! 🏔️`,
            html: emailHtml,
          });

          if (result.success) {
            reminder.sentReminders.push(diffDays);
            await reminder.save();
            emailsSentCount++;
            results.push({ email: reminder.email, festival: reminder.festival.name, daysBefore: diffDays, status: "sent" });
          } else {
            results.push({ email: reminder.email, festival: reminder.festival.name, daysBefore: diffDays, status: "failed", error: result.error });
          }
        }
      }
    }

    return res.status(200).json({
      message: "Reminder scan completed successfully",
      emailsSent: emailsSentCount,
      details: results,
    });
  } catch (error) {
    console.error("TRIGGER REMINDERS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: SEND REMINDER MANUALLY (Dispatches immediately regardless of date)
export const sendReminderManuallyAdmin = async (req, res) => {
  try {
    const { reminderId } = req.params;

    const reminder = await FestivalReminder.findById(reminderId)
      .populate("festival")
      .populate("user", "name email");

    if (!reminder) return res.status(404).json({ message: "Reminder subscription not found" });
    if (!reminder.festival) return res.status(400).json({ message: "Associated festival not found" });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">Upcoming Celebration! 🌸</h2>
        <p>Hello ${reminder.user?.name || "Traveler"},</p>
        <p>This is a manual festival celebration alert for <b>${reminder.festival.name}</b> in Sikkim.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 5px 0;"><b>Festival Name:</b> ${reminder.festival.name}</p>
          <p style="margin: 5px 0;"><b>Date:</b> ${reminder.festival.date ? new Date(reminder.festival.date).toLocaleDateString('en-IN') : "N/A"}</p>
          <p style="margin: 5px 0;"><b>Location:</b> ${reminder.festival.location || "Sikkim"}</p>
          <p style="margin: 5px 0;"><b>Month:</b> ${reminder.festival.month}</p>
        </div>

        <p><b>About the Festival:</b></p>
        <p>${reminder.festival.description}</p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center;">You received this email because you subscribed to reminders for this festival on Monastery360.</p>
      </div>
    `;

    const result = await sendEmail({
      to: reminder.email,
      subject: `Special Festival Alert: ${reminder.festival.name} is coming up! 🏔️`,
      html: emailHtml,
    });

    if (result.success) {
      return res.status(200).json({ message: `Manual reminder sent successfully to ${reminder.email}! 📩` });
    } else {
      return res.status(500).json({ message: result.error || "Failed to send manual reminder" });
    }
  } catch (error) {
    console.error("MANUAL REMINDER ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
