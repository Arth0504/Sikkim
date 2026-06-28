import express from 'express';
const router = express.Router();

import {
  subscribeReminder,
  unsubscribeReminder,
  getSubscriptionStatus
} from '../controllers/festivalReminderController.js';
import { protect } from '../middleware/authMiddleware.js';

// Traveler routes
router.post('/subscribe', protect, subscribeReminder);
router.post('/unsubscribe/:festivalId', protect, unsubscribeReminder);
router.delete('/unsubscribe/:festivalId', protect, unsubscribeReminder);
router.get('/status/:festivalId', protect, getSubscriptionStatus);

export default router;
