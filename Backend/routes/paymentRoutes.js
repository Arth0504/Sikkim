import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createOrder,
  verifyPayment,
  refundPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "payments route working" });
});

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.post("/refund", protect, refundPayment);

export default router;