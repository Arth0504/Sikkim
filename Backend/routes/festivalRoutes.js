import express from 'express';
const router = express.Router();

import { addFestival, getFestivals, getFestivalsByMonth } from '../controllers/festivalController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import uploadFestivalImage from '../config/multerFestival.js';

// Admin add festival (with image)
router.post('/', protect, isAdmin, uploadFestivalImage.single('image'), addFestival);

// Public routes
router.get('/', getFestivals);
router.get('/:month', getFestivalsByMonth);

export default router;
