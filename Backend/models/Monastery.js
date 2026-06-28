import mongoose from 'mongoose';

const monasterySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    history: {
      type: String,
      default: "",
    },

    rules: {
      type: String,
      default: "",
    },

    // ✅ add this for cover image
    image: {
      type: String,
      default: "",
    },

    // ✅ add this for google embed / 360 tour iframe
    iframe360: {
      type: String,
      default: "",
    },

    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Monastery", monasterySchema);;
