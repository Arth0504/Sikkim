import fs from 'fs';
import path from 'path';
import Package from '../models/Package.js';

import jwt from "jsonwebtoken";
import User from "../models/User.js";

const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  // imagePath stored as "/uploads/package-images/pkg-xxx.jpg"
  const filePath = path.join(process.cwd(), imagePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const isAdminUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) return false;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    return user && user.role === "admin";
  } catch {
    return false;
  }
};

// ✅ CREATE PACKAGE (ADMIN)
export const createPackage = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      data.image = `/uploads/package-images/${req.file.filename}`;
    }

    // itinerary comes as JSON string from FormData
    if (typeof data.itinerary === 'string') {
      data.itinerary = JSON.parse(data.itinerary);
    }

    const pkg = await Package.create(data);
    return res.status(201).json({ message: 'Package added successfully', package: pkg });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/package-images/${req.file.filename}`);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET ALL PACKAGES (USER)
export const getPackages = async (req, res) => {
  try {
    const isAdmin = await isAdminUser(req);
    let query = Package.find({ isCustom: { $ne: true } });
    if (!isAdmin) {
      query = query.select("-itinerary -driverInfo");
    }
    const packages = await query.sort({ createdAt: -1 });
    return res.status(200).json(packages);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET SINGLE PACKAGE
export const getPackageById = async (req, res) => {
  try {
    const isAdmin = await isAdminUser(req);
    let query = Package.findById(req.params.id);
    if (!isAdmin) {
      query = query.select("-itinerary -driverInfo");
    }
    const pkg = await query;
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    return res.status(200).json(pkg);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ SEARCH/FILTER
export const searchPackages = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q 
      ? { name: { $regex: q, $options: 'i' }, isCustom: { $ne: true } } 
      : { isCustom: { $ne: true } };
    const isAdmin = await isAdminUser(req);
    let query = Package.find(filter);
    if (!isAdmin) {
      query = query.select("-itinerary -driverInfo");
    }
    const results = await query.sort({ createdAt: -1 });
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE PACKAGE (ADMIN)
export const updatePackage = async (req, res) => {
  try {
    const existing = await Package.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Package not found' });

    const data = { ...req.body };

    if (req.file) {
      // remove old image from disk
      deleteImageFile(existing.image);
      data.image = `/uploads/package-images/${req.file.filename}`;
    }

    if (typeof data.itinerary === 'string') {
      data.itinerary = JSON.parse(data.itinerary);
    }

    const pkg = await Package.findByIdAndUpdate(req.params.id, data, { new: true });
    return res.status(200).json({ message: 'Package updated successfully', package: pkg });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/package-images/${req.file.filename}`);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE PACKAGE (ADMIN)
export const deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    deleteImageFile(pkg.image);

    return res.status(200).json({ message: 'Package deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ LOG PACKAGE COMPARISON
export const logComparison = async (req, res) => {
  try {
    const { packageIds } = req.body;
    if (packageIds && Array.isArray(packageIds)) {
      await Package.updateMany(
        { _id: { $in: packageIds } },
        { $inc: { compareCount: 1 } }
      );
    }
    return res.status(200).json({ message: "Comparison logged successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
