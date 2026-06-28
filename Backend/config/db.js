import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import Festival from "../models/Festival.js";
import Monastery from "../models/Monastery.js";
import Package from "../models/Package.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import CustomReservation from "../models/CustomReservation.js";

const requiredCollections = [
  { label: "Packages", model: Package },
  { label: "Festivals", model: Festival },
  { label: "Monasteries", model: Monastery },
  { label: "Users", model: User },
  { label: "Bookings", model: Booking },
  { label: "Payments", model: Payment },
  { label: "CustomReservations", model: CustomReservation },
];

const connectionOptions = {
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
};

const localMongoPattern = /mongodb:\/\/(localhost|127\.0\.0\.1)/i;
const placeholderPattern = /(YOUR_ATLAS_USERNAME|YOUR_ATLAS_PASSWORD|<USERNAME>|<PASSWORD>)/i;

export const ensureRequiredCollections = async () => {
  const existingCollections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  const existingCollectionNames = new Set(
    existingCollections.map((collection) => collection.name)
  );

  for (const { label, model } of requiredCollections) {
    const collectionName = model.collection.name;

    if (!existingCollectionNames.has(collectionName)) {
      await model.createCollection();
      existingCollectionNames.add(collectionName);
    }

    console.log(`${label} collection verified`);
  }
};

const validateMongoUri = (label, mongoUri) => {
  if (!mongoUri) {
    throw new Error(`${label} is missing in .env`);
  }

  // if (localMongoPattern.test(mongoUri)) {
  //   throw new Error(`${label} still points to local MongoDB. Use the MongoDB Atlas URI.`);
  // }

  if (placeholderPattern.test(mongoUri)) {
    throw new Error(`${label} contains placeholder Atlas credentials.`);
  }
};

const getConnectionCandidates = () => {
  const candidates = [];

  if (process.env.MONGO_URI) {
    candidates.push({
      label: "MONGO_URI",
      uri: process.env.MONGO_URI,
    });
  }

  if (
    process.env.MONGO_URI_FALLBACK &&
    process.env.MONGO_URI_FALLBACK !== process.env.MONGO_URI
  ) {
    candidates.push({
      label: "MONGO_URI_FALLBACK",
      uri: process.env.MONGO_URI_FALLBACK,
    });
  }

  return candidates;
};

const connectDB = async () => {
  const candidates = getConnectionCandidates();
  const failures = [];

  if (candidates.length === 0) {
    throw new Error("MONGO_URI is missing in .env");
  }

  for (const { label, uri } of candidates) {
    try {
      validateMongoUri(label, uri);
      await mongoose.connect(uri, connectionOptions);
      console.log(`MongoDB Atlas Connected Successfully using ${label}`);
      await ensureRequiredCollections();
      return mongoose.connection;
    } catch (error) {
      failures.push(`${label}: ${error.message}`);
      console.error(`MongoDB Atlas connection failed using ${label}:`, error.message);
      await mongoose.disconnect().catch(() => {});
    }
  }

  throw new Error(`Unable to connect to MongoDB Atlas. ${failures.join(" | ")}`);
};

export default connectDB;
