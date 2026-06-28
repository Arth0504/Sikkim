import express from 'express';
const router = express.Router();

import { protect, isAdmin  } from '../middleware/authMiddleware.js';
import { getDashboardStats  } from '../controllers/adminDashboardController.js';

router.get("/dashboard", protect, isAdmin, getDashboardStats);

export default router;;
