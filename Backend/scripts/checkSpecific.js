import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import CustomReservation from "../models/CustomReservation.js";
import Package from "../models/Package.js";

dotenv.config();

const runCheck = async () => {
  try {
    await connectDB();
    
    const customPkgs = await Package.find({ isCustom: true });
    console.log(`Found ${customPkgs.length} custom packages:`);
    customPkgs.forEach(pkg => {
      console.log(`- Package ID: ${pkg._id}, Name: "${pkg.name}", Price: ₹${pkg.price}`);
    });

    const reservations = await CustomReservation.find();
    console.log(`\nFound ${reservations.length} custom reservation(s):`);
    reservations.forEach(r => {
      console.log(`\nReservation ID: ${r._id}`);
      console.log(`Status: ${r.status}`);
      console.log(`customPackage ref in DB (raw):`, r.customPackage);
      console.log(`aiGeneratedPlan exists:`, !!r.aiGeneratedPlan);
      if (r.aiGeneratedPlan) {
        console.log(`- Plan Name: "${r.aiGeneratedPlan.name}"`);
        console.log(`- Itinerary days:`, r.aiGeneratedPlan.itinerary?.length);
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

runCheck();
