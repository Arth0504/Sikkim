import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    location: {
      type: String,
    },
    hotel: {
      type: String,
    },
    activities: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    // ✅ NEW: image field added
    image: {
      type: String,
      default: "",
    },

    monasteries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Monastery",
      },
    ],

    itinerary: [itinerarySchema],

    driverInfo: {
      type: String,
      default: "",
    },

    policies: {
      type: String,
      default: "",
    },

    // ✅ Comparison Fields
    difficulty: {
      type: String,
      default: "Moderate",
    },

    accommodation: {
      type: String,
      default: "Standard Hotel / Guest House",
    },

    meals: {
      type: String,
      default: "Breakfast Included",
    },

    transport: {
      type: String,
      default: "Shared SUV / Cab",
    },

    inclusions: {
      type: [String],
      default: ["Accommodation", "Breakfast", "Sightseeing", "Permits"],
    },

    exclusions: {
      type: [String],
      default: ["Lunch & Dinner", "Personal Expenses", "Tips"],
    },

    compareCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Package", packageSchema);;
