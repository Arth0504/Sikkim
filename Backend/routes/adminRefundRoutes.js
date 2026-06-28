import express from 'express';
const router = express.Router();

import { protect, isAdmin  } from '../middleware/authMiddleware.js';
import { approveRefund  } from '../controllers/adminRefundController.js';

// ✅ Admin approve refund
router.put("/approve-refund/:bookingId", protect, isAdmin, approveRefund);

export default router;;
