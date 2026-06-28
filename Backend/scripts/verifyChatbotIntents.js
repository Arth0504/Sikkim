import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { handleChatQuery } from "../controllers/assistantController.js";

dotenv.config();

const questions = [
  { q: "Hello, Tashi Delek!", label: "Greeting check" },
  { q: "What is the best monastery to visit in Sikkim?", label: "Monastery list check" },
  { q: "Show me monasteries in West Sikkim", label: "Regional monastery filter check" },
  { q: "Do you have packages under 15000?", label: "Budget package constraint check" },
  { q: "List all tour packages", label: "General packages list check" },
  { q: "Tell me about Losar festival", label: "General festivals check" },
  { q: "When is the best season/weather to visit East Sikkim?", label: "Travel season check" },
  { q: "How do I book a tour or request a refund?", label: "Booking/cancellation guide check" },
  { q: "I want to create a custom package", label: "Custom builder intent check" },
  { q: "What should I pack or know about permits?", label: "Permits and tips check" },
  { q: "random string of characters", label: "Fallback check" }
];

const runTest = async () => {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Connected successfully! ✅\n");

    for (const test of questions) {
      console.log(`\n========================================`);
      console.log(`Test Label: ${test.label}`);
      console.log(`User Question: "${test.q}"`);
      console.log(`----------------------------------------`);
      
      const mockReq = { body: { message: test.q } };
      let replyText = "";
      
      const mockRes = {
        status: (code) => {
          return {
            json: (data) => {
              replyText = data.reply;
            }
          };
        }
      };

      await handleChatQuery(mockReq, mockRes);
      console.log("Chatbot Response:");
      console.log(replyText);
    }

    console.log(`\n========================================`);
    await mongoose.disconnect();
    console.log("Chatbot intent validation successful! 🎉");
    process.exit(0);
  } catch (error) {
    console.error("❌ Chatbot verification failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

runTest();
