import Notification from '../models/Notification.js';

/**
 * Helper to easily create an admin notification
 * @param {Object} data
 * @param {string} data.title - Notification title
 * @param {string} data.message - Detailed notification message
 * @param {string} data.type - Event type
 * @param {string} [data.referenceId] - Associated object ID
 * @param {string} [data.actionUrl] - Public/Admin route to open
 */
export const createAdminNotification = async ({ title, message, type, referenceId = "", actionUrl = "" }) => {
  try {
    const notification = await Notification.create({
      title,
      message,
      type,
      isRead: false,
      referenceId,
      actionUrl,
    });
    console.log(`[Notification] Auto-created alert ID: ${notification._id} [Type: ${type}]`);
    return notification;
  } catch (error) {
    console.error("[Notification] Error creating admin notification:", error.message);
    return null;
  }
};
