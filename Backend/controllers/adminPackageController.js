import Package from '../models/Package.js';

export const addPackage = async (req, res) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json({ message: "Package added successfully", package: pkg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package updated successfully", package: pkg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
