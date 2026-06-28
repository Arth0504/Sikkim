import mongoose from 'mongoose';

const festivalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    month: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: false,
    },

    location: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: ["cultural", "religious", "traditional", "tourism", "national"],
      default: "cultural",
    },

    // ✅ IMPORTANT
    image: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Festival", festivalSchema);;
