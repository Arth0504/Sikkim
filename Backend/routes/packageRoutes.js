import express from 'express';
const router = express.Router();

import {
  createPackage,
  getPackages,
  getPackageById,
  searchPackages,
  updatePackage,
  deletePackage,
  logComparison,
} from '../controllers/packageController.js';
import { buildCustomPackage } from '../controllers/customBuilderController.js';
import {
  createReservation,
  getUserReservations,
  getReservationById,
} from '../controllers/customReservationController.js';

import { protect, isAdmin } from '../middleware/authMiddleware.js';
import uploadPackageImage from '../config/multerPackage.js';

// 🔍 Search & filter
router.get('/search/filter', searchPackages);
router.post('/custom-builder', buildCustomPackage);
router.post('/custom-builder/reserve', protect, createReservation);
router.get('/custom-builder/reservations', protect, getUserReservations);
router.get('/custom-builder/reservations/:id', protect, getReservationById);

// 📦 All packages
router.get('/', getPackages);

// 📦 Single package
router.get('/:id', getPackageById);

// 👑 Admin create package (with optional image)
router.post('/', protect, isAdmin, uploadPackageImage.single('image'), createPackage);

// 👑 Admin update package (with optional image replacement)
router.put('/:id', protect, isAdmin, uploadPackageImage.single('image'), updatePackage);

// 👑 Admin delete package
router.delete('/:id', protect, isAdmin, deletePackage);

// 🔍 Log package comparisons
router.post('/compare-log', logComparison);

export default router;
