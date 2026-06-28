import express from 'express';
const router = express.Router();

import { addMonastery, getMonasteries, getMonasteryById, updateMonastery, deleteMonastery } from '../controllers/monasteryController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import uploadMonasteryImage from '../config/multerMonastery.js';

// Admin routes (with image upload)
router.post('/', protect, isAdmin, uploadMonasteryImage.single('image'), addMonastery);
router.put('/:id', protect, isAdmin, uploadMonasteryImage.single('image'), updateMonastery);
router.delete('/:id', protect, isAdmin, deleteMonastery);

// Public routes
router.get('/', getMonasteries);
router.get('/:id', getMonasteryById);

export default router;
