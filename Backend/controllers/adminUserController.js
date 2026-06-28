import User from '../models/User.js';

// ✅ GET ALL USERS (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error("GET USERS ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE USER (Admin)
export const updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ don't allow admin to change super important fields wrongly
    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();

    // role optional (only if your project supports role change)
    if (role) user.role = role;

    await user.save();

    return res.status(200).json({
      message: "User updated ✅",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("UPDATE USER ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE USER (Admin)
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ optional: block deleting admin
    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin user cannot be deleted" });
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({ message: "User deleted ✅" });
  } catch (error) {
    console.error("DELETE USER ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};
export const blockUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin cannot be blocked" });
    }

    user.isBlocked = true;
    user.blockedAt = new Date();
    await user.save();

    return res.status(200).json({ message: "User blocked ✅", user });
  } catch (error) {
    console.error("BLOCK USER ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

export const unblockUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = false;
    user.blockedAt = null;
    await user.save();

    return res.status(200).json({ message: "User unblocked ✅", user });
  } catch (error) {
    console.error("UNBLOCK USER ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};
