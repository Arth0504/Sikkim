import Festival from '../models/Festival.js';

// ADMIN: Add festival (also handles file upload when called via festivalRoutes)
export const addFestival = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/festival-images/${req.file.filename}`;

    const festival = await Festival.create(data);
    res.status(201).json({ message: 'Festival added successfully', festival });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// USER: Get all festivals
export const getFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find().sort({ month: 1 });
    res.status(200).json(festivals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// USER: Get festivals by month
export const getFestivalsByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    const festivals = await Festival.find({ month });
    res.status(200).json(festivals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
