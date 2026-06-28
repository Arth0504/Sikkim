import fs from 'fs';
import path from 'path';
import Monastery from '../models/Monastery.js';

const deleteImageFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith('/uploads')) return;
  const filePath = path.join(process.cwd(), imagePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// ✅ CREATE
export const addMonastery = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/monastery-images/${req.file.filename}`;

    const monastery = await Monastery.create(data);
    return res.status(201).json({ message: 'Monastery added successfully', monastery });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/monastery-images/${req.file.filename}`);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET ALL
export const getMonasteries = async (req, res) => {
  try {
    const monasteries = await Monastery.find().sort({ createdAt: -1 });
    return res.status(200).json(monasteries);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET ONE
export const getMonasteryById = async (req, res) => {
  try {
    const monastery = await Monastery.findById(req.params.id);
    if (!monastery) return res.status(404).json({ message: 'Monastery not found' });
    return res.status(200).json(monastery);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE
export const updateMonastery = async (req, res) => {
  try {
    const existing = await Monastery.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Monastery not found' });

    const data = { ...req.body };
    if (req.file) {
      deleteImageFile(existing.image);
      data.image = `/uploads/monastery-images/${req.file.filename}`;
    }

    const monastery = await Monastery.findByIdAndUpdate(req.params.id, data, { new: true });
    return res.status(200).json({ message: 'Monastery updated successfully', monastery });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/monastery-images/${req.file.filename}`);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE
export const deleteMonastery = async (req, res) => {
  try {
    const monastery = await Monastery.findByIdAndDelete(req.params.id);
    if (!monastery) return res.status(404).json({ message: 'Monastery not found' });
    deleteImageFile(monastery.image);
    return res.status(200).json({ message: 'Monastery deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
