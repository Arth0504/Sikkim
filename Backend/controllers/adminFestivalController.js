import fs from 'fs';
import path from 'path';
import Festival from '../models/Festival.js';

const deleteImageFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith('/uploads')) return;
  const filePath = path.join(process.cwd(), imagePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// ✅ GET ALL FESTIVALS (ADMIN)
export const getAllFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find().sort({ createdAt: -1 });
    res.json(festivals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ ADD FESTIVAL
export const addFestival = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/festival-images/${req.file.filename}`;

    const festival = await Festival.create(data);
    res.status(201).json(festival);
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/festival-images/${req.file.filename}`);
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE FESTIVAL
export const updateFestival = async (req, res) => {
  try {
    const existing = await Festival.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Festival not found' });

    const data = { ...req.body };
    if (req.file) {
      deleteImageFile(existing.image);
      data.image = `/uploads/festival-images/${req.file.filename}`;
    }

    const festival = await Festival.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(festival);
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/festival-images/${req.file.filename}`);
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE FESTIVAL
export const deleteFestival = async (req, res) => {
  try {
    const festival = await Festival.findByIdAndDelete(req.params.id);
    if (!festival) return res.status(404).json({ message: 'Festival not found' });
    deleteImageFile(festival.image);
    res.json({ message: 'Festival deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
