import Wishlist from '../models/Wishlist.js';
import Package from '../models/Package.js';

// ✅ ADD TO WISHLIST
export const addToWishlist = async (req, res) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ message: "Package ID is required" });
    }

    // Verify package exists
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    // Check if already in wishlist
    const exists = await Wishlist.findOne({ user: req.user._id, package: packageId });
    if (exists) {
      return res.status(400).json({ message: "Package is already in your wishlist" });
    }

    const item = await Wishlist.create({
      user: req.user._id,
      package: packageId,
    });

    return res.status(201).json({ message: "Added to wishlist ❤️", item });
  } catch (error) {
    console.error("ADD TO WISHLIST ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ REMOVE FROM WISHLIST
export const removeFromWishlist = async (req, res) => {
  try {
    const { packageId } = req.params;

    const result = await Wishlist.findOneAndDelete({ user: req.user._id, package: packageId });
    if (!result) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    return res.status(200).json({ message: "Removed from wishlist ✅" });
  } catch (error) {
    console.error("REMOVE FROM WISHLIST ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ GET USER'S WISHLIST
export const getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .populate("package", "name image price duration description")
      .sort({ createdAt: -1 });

    return res.status(200).json(items);
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: GET MOST WISHLISTED PACKAGES
export const getMostWishlistedPackages = async (req, res) => {
  try {
    const stats = await Wishlist.aggregate([
      {
        $group: {
          _id: "$package",
          wishlistCount: { $sum: 1 },
        },
      },
      {
        $sort: { wishlistCount: -1 },
      },
      {
        $lookup: {
          from: "packages",
          localField: "_id",
          foreignField: "_id",
          as: "pkgDetails",
        },
      },
      {
        $unwind: "$pkgDetails",
      },
      {
        $match: { "pkgDetails.isCustom": { $ne: true } },
      },
      {
        $project: {
          _id: 0,
          packageId: "$_id",
          wishlistCount: 1,
          name: "$pkgDetails.name",
          price: "$pkgDetails.price",
          image: "$pkgDetails.image",
          duration: "$pkgDetails.duration",
        },
      },
    ]);

    return res.status(200).json(stats);
  } catch (error) {
    console.error("GET MOST WISHLISTED ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
