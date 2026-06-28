import Notification from '../models/Notification.js';

// ✅ GET ALL NOTIFICATIONS (Search, Filters, Pagination)
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", type = "", isRead = "" } = req.query;

    const query = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by read status
    if (isRead !== "") {
      query.isRead = isRead === "true";
    }

    // Search query in title or message
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ isRead: false });

    return res.status(200).json({
      notifications,
      total,
      unreadCount,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ MARK SINGLE NOTIFICATION AS READ
export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.status(200).json({ message: "Notification marked as read successfully ✅", notification });
  } catch (error) {
    console.error("MARK READ ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ MARK ALL NOTIFICATIONS AS READ
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return res.status(200).json({ message: "All notifications marked as read successfully ✅" });
  } catch (error) {
    console.error("MARK ALL READ ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
