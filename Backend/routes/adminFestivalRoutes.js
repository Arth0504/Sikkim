import express from 'express';
const router = express.Router();

import { protect, isAdmin } from '../middleware/authMiddleware.js';
import { getAllFestivals, addFestival, updateFestival, deleteFestival } from '../controllers/adminFestivalController.js';
import uploadFestivalImage from '../config/multerFestival.js';

router.get('/', protect, isAdmin, getAllFestivals);
router.post('/', protect, isAdmin, uploadFestivalImage.single('image'), addFestival);
router.put('/:id', protect, isAdmin, uploadFestivalImage.single('image'), updateFestival);
router.delete('/:id', protect, isAdmin, deleteFestival);

export default router;
