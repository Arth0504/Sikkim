import express from 'express';
const router = express.Router();

import { getPolicy,
  createOrUpdatePolicy,
 } from '../controllers/cancellationPolicyController.js';

import { protect, isAdmin  } from '../middleware/authMiddleware.js';

// ✅ USER
router.get("/", getPolicy);

// ✅ ADMIN
router.post("/", protect, isAdmin, createOrUpdatePolicy);

export default router;;
