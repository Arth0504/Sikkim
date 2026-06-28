import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔐 PROTECT MIDDLEWARE
export const protect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // assign user
    req.user = user;

    // BLOCK CHECK
    if (req.user.isBlocked === true) {
      return res
        .status(403)
        .json({ message: "Your account is blocked by admin" });
    }

    next();
  } catch (error) {
    console.log("AUTH ERROR =>", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// 👑 ADMIN MIDDLEWARE
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Admin access only" });
  }
};