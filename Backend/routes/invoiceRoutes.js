import express from 'express';
const router = express.Router();

import { downloadInvoice  } from '../controllers/invoiceController.js';
import { protect  } from '../middleware/authMiddleware.js';

// Download invoice (User/Admin)
router.get("/:bookingId", protect, downloadInvoice)

export default router;;
