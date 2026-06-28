import Monastery from '../models/Monastery.js';

export const addMonastery = async (req, res) => {
  try {
    const monastery = await Monastery.create(req.body);
    res.status(201).json({ message: "Monastery added successfully", monastery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMonastery = async (req, res) => {
  try {
    const monastery = await Monastery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!monastery) return res.status(404).json({ message: "Monastery not found" });
    res.json({ message: "Monastery updated successfully", monastery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMonastery = async (req, res) => {
  try {
    const monastery = await Monastery.findByIdAndDelete(req.params.id);
    if (!monastery) return res.status(404).json({ message: "Monastery not found" });
    res.json({ message: "Monastery deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
