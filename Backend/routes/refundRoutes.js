import express from 'express';
const router = express.Router();
import { refundPayment  } from '../controllers/refundController.js';
import { protect  } from '../middleware/authMiddleware.js';

// Admin or User (based on your rule)
router.post("/refund", protect, refundPayment);

export default router;;
