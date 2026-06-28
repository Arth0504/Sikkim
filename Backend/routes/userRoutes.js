import express from 'express';
const router = express.Router();

import { registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  googleLogin,
 } from '../controllers/userController.js';

import { protect, isAdmin  } from '../middleware/authMiddleware.js';

// routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

router.get("/admin-test", protect, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin 👑" });
});

export default router;;
