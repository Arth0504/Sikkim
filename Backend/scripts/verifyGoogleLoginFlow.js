import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import { googleLogin } from "../controllers/userController.js";
import { getDashboardStats } from "../controllers/adminDashboardController.js";

dotenv.config();

const runVerification = async () => {
  try {
    console.log("Connecting to Database...");
    await connectDB();

    console.log("Cleaning up any existing mock users...");
    await User.deleteMany({ email: { $in: ["new-google-user@example.com", "link-google-user@example.com"] } });

    console.log("\n=================================");
    console.log("STEP 1: Test New User Creation");
    console.log("=================================");
    
    // Prepare mock google credential (base64 encoded JSON)
    const mockNewUserData = {
      sub: "google-id-11111",
      email: "new-google-user@example.com",
      name: "New Google Traveler",
      picture: "https://lh3.googleusercontent.com/mock-new-user-pic"
    };
    const mockNewToken = "mock-google-token-" + Buffer.from(JSON.stringify(mockNewUserData)).toString("base64");

    // Mock Express Request & Response objects
    let resData = null;
    let resStatus = null;
    const req = {
      body: { credential: mockNewToken }
    };
    const res = {
      status: (code) => {
        resStatus = code;
        return res;
      },
      json: (data) => {
        resData = data;
        return res;
      }
    };

    await googleLogin(req, res);

    if (resStatus !== 200) {
      throw new Error(`Google Login failed with status: ${resStatus}, message: ${resData?.message}`);
    }

    console.log("Google Login API request succeeded!");
    console.log("Returned token:", resData.token ? "PRESENT ✅" : "MISSING ❌");
    console.log("Returned user:", JSON.stringify(resData.user));

    // Verify MongoDB document
    const createdUser = await User.findOne({ email: "new-google-user@example.com" });
    if (!createdUser) {
      throw new Error("User was not found in MongoDB after Google Login creation!");
    }
    
    console.log("\nVerifying MongoDB Fields:");
    console.log("- provider:", createdUser.provider === "google" ? "google ✅" : `FAIL (${createdUser.provider})`);
    console.log("- googleId:", createdUser.googleId === "google-id-11111" ? "google-id-11111 ✅" : `FAIL (${createdUser.googleId})`);
    console.log("- profilePicture:", createdUser.profilePicture === "https://lh3.googleusercontent.com/mock-new-user-pic" ? "MATCH ✅" : `FAIL (${createdUser.profilePicture})`);
    
    if (createdUser.provider !== "google" || createdUser.googleId !== "google-id-11111" || createdUser.profilePicture !== "https://lh3.googleusercontent.com/mock-new-user-pic") {
      throw new Error("User document fields in MongoDB do not match expectation!");
    }

    console.log("\n=================================");
    console.log("STEP 2: Test Existing User Linking");
    console.log("=================================");

    // Create a local user first
    console.log("Creating local user first...");
    const localUser = await User.create({
      name: "Local Traveler",
      email: "link-google-user@example.com",
      password: "localpassword123",
      provider: "local"
    });

    console.log("Local user created in provider 'local'.");

    // Login with Google using same email
    const mockLinkUserData = {
      sub: "google-id-22222",
      email: "link-google-user@example.com",
      name: "Google Linked Traveler",
      picture: "https://lh3.googleusercontent.com/mock-link-user-pic"
    };
    const mockLinkToken = "mock-google-token-" + Buffer.from(JSON.stringify(mockLinkUserData)).toString("base64");

    resData = null;
    resStatus = null;
    const reqLink = {
      body: { credential: mockLinkToken }
    };

    console.log("Attempting Google login for the same email...");
    await googleLogin(reqLink, res);

    if (resStatus !== 200) {
      throw new Error(`Google Login for linking failed with status: ${resStatus}, message: ${resData?.message}`);
    }

    // Verify user is linked in MongoDB
    const linkedUser = await User.findOne({ email: "link-google-user@example.com" });
    if (!linkedUser) {
      throw new Error("Linked user not found in MongoDB!");
    }

    console.log("\nVerifying MongoDB Fields after linking:");
    console.log("- provider updated to google:", linkedUser.provider === "google" ? "google ✅" : `FAIL (${linkedUser.provider})`);
    console.log("- googleId added:", linkedUser.googleId === "google-id-22222" ? "google-id-22222 ✅" : `FAIL (${linkedUser.googleId})`);
    console.log("- profilePicture added:", linkedUser.profilePicture === "https://lh3.googleusercontent.com/mock-link-user-pic" ? "MATCH ✅" : `FAIL (${linkedUser.profilePicture})`);
    console.log("- password preserved:", linkedUser.password ? "YES ✅" : "NO ❌");

    if (linkedUser.provider !== "google" || linkedUser.googleId !== "google-id-22222" || !linkedUser.password) {
      throw new Error("User linking fields did not update correctly in MongoDB!");
    }

    console.log("\n=================================");
    console.log("STEP 3: Verify Admin Analytics (Google Users Count)");
    console.log("=================================");

    const reqStats = {};
    let statsData = null;
    const resStats = {
      status: () => resStats,
      json: (data) => {
        statsData = data;
        return resStats;
      }
    };

    await getDashboardStats(reqStats, resStats);
    console.log("Dashboard Stats retrieved.");
    console.log("Total Users:", statsData.counts?.users);
    console.log("Google Users Count:", statsData.counts?.googleUsers);
    
    if (typeof statsData.counts?.googleUsers !== "number") {
      throw new Error("Dashboard stats does not contain googleUsers count!");
    }
    console.log("Google Users Count verified in Admin stats successfully! ✅");

    console.log("\nAll Google Login OAuth & linking tests completed successfully! 🎉");
    await User.deleteMany({ email: { $in: ["new-google-user@example.com", "link-google-user@example.com"] } });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\nVerification Failed ❌");
    console.error(error);
    await User.deleteMany({ email: { $in: ["new-google-user@example.com", "link-google-user@example.com"] } }).catch(() => {});
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

runVerification();
