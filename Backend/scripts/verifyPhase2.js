import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { suggestPackageDetails } from "../controllers/adminAssistantController.js";
import { buildCustomPackage } from "../controllers/customBuilderController.js";
import { handleChatQuery } from "../controllers/assistantController.js";

dotenv.config();

const runTest = async () => {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Database connected successfully! \n");

    // 1. Verify Admin Package Creator Assistant API
    console.log("--- 1. Testing suggestPackageDetails (Admin Package Assistant) ---");
    const mockSuggestReq = { query: { name: "North Sikkim Trekking Journey" } };
    const mockSuggestRes = {
      status: (code) => {
        return {
          json: (data) => {
            console.log(`Region Detected:`, data.region);
            console.log(`Suggested Monasteries count:`, data.suggestedMonasteries.length);
            console.log(`Suggested Season:`, data.bestSeason);
            console.log(`PAP Permit Required:`, data.permitRequired);
            console.log("Smart Suggestions query works! ✅\n");
          }
        };
      }
    };
    await suggestPackageDetails(mockSuggestReq, mockSuggestRes);

    // 2. Verify Custom Package Builder API
    console.log("--- 2. Testing buildCustomPackage (Custom Tour Builder) ---");
    const mockCustomReq = {
      body: {
        budget: "medium",
        duration: "short",
        interests: "spiritual",
        region: "North Sikkim"
      }
    };
    const mockCustomRes = {
      status: (code) => {
        return {
          json: (data) => {
            console.log(`Success:`, data.success);
            console.log(`Matching Packages count:`, data.matchingPackages.length);
            console.log(`Synthesized Tour:`, data.customRecommendation.name);
            console.log(`Synthesized Price:`, data.customRecommendation.price);
            console.log(`Day-by-day Itinerary length:`, data.customRecommendation.itinerary.length);
            console.log("Custom Package Builder query works! ✅\n");
          }
        };
      }
    };
    await buildCustomPackage(mockCustomReq, mockCustomRes);

    // 3. Verify Chatbot Query API
    console.log("--- 3. Testing handleChatQuery (AI Chatbot) ---");
    const mockChatReq = {
      body: {
        message: "Tell me the best monasteries to visit and permit tips"
      }
    };
    const mockChatRes = {
      status: (code) => {
        return {
          json: (data) => {
            console.log(`Chatbot Reply Preview:`);
            console.log(data.reply.substring(0, 200) + "...");
            console.log("AI Chatbot query works! ✅\n");
          }
        };
      }
    };
    await handleChatQuery(mockChatReq, mockChatRes);

    await mongoose.disconnect();
    console.log("All Phase 2 APIs verified successfully! ✅");
    process.exit(0);
  } catch (error) {
    console.error("❌ Phase 2 verification failed:", error);
    await mongoose.disconnect().catch(() => { });
    process.exit(1);
  }
};

runTest();
