import CancellationPolicy from '../models/CancellationPolicy.js';

// ✅ USER: Get Policy
export const getPolicy = async (req, res) => {
  try {
    const policy = await CancellationPolicy.findOne().sort({ updatedAt: -1 });

    if (!policy) {
      return res.status(200).json({
        title: "Cancellation Policy",
        description: "Policy not added yet.",
      });
    }

    return res.status(200).json(policy);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Create/Update Policy
export const createOrUpdatePolicy = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "title and description required" });
    }

    const existing = await CancellationPolicy.findOne();

    if (existing) {
      existing.title = title;
      existing.description = description;
      existing.updatedBy = req.user._id;
      await existing.save();

      return res.status(200).json({
        message: "Policy updated",
        policy: existing,
      });
    }

    const policy = await CancellationPolicy.create({
      title,
      description,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      message: "Policy created",
      policy,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
