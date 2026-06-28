import connectDB from "../config/db.js";
import Query from "../models/Query.js";
import { createQuery, getAdminQueryById, replyAdminQuery, toggleQueryReadStatus } from "../controllers/queryController.js";
import dotenv from "dotenv";

dotenv.config();

const runVerification = async () => {
  console.log("🚀 Starting Query Email System Verification...");
  
  // 1. Connect DB
  await connectDB();
  
  // Clean up any test queries first
  await Query.deleteMany({ email: "test_verification@example.com" });

  // Mock Request & Response for createQuery
  const reqCreate = {
    body: {
      name: "Test Verification User",
      email: "test_verification@example.com",
      phone: "1234567890",
      subject: "Test Query Subject",
      message: "This is a test query message for verification of the enhanced email system."
    }
  };

  let createdQuery = null;
  const resCreate = {
    status: (code) => {
      console.log(`[Create Query] Response status: ${code}`);
      return {
        json: (data) => {
          console.log(`[Create Query] Response message:`, data.message);
          createdQuery = data.query;
          return data;
        }
      };
    }
  };

  // 2. Test createQuery
  console.log("\n--- Testing createQuery & Unique Ref ID generation ---");
  await createQuery(reqCreate, resCreate);

  if (!createdQuery) {
    throw new Error("Query creation failed!");
  }

  const queryId = createdQuery._id;

  // Verify created fields in DB
  const queryFromDb = await Query.findById(queryId);
  console.log("\n--- Verifying Database Fields ---");
  console.log(`Reference ID: ${queryFromDb.referenceId}`);
  console.log(`Ack Email Status: ${queryFromDb.acknowledgementEmailStatus}`);
  console.log(`Ack Email Sent At: ${queryFromDb.acknowledgementEmailSentAt}`);
  console.log(`Is Admin Read: ${queryFromDb.isAdminRead}`);
  
  if (!queryFromDb.referenceId.startsWith("QUERY-") || queryFromDb.referenceId.length !== 11) {
    throw new Error("Invalid Reference ID format!");
  }
  
  // 3. Test getAdminQueryById (should mark as read and transition to IN_PROGRESS)
  console.log("\n--- Testing getAdminQueryById & Auto-Read ---");
  const reqGet = { params: { id: queryId } };
  const resGet = {
    status: (code) => {
      console.log(`[Get Query] Response status: ${code}`);
      return {
        json: (data) => {
          console.log(`[Get Query] Is Admin Read: ${data.isAdminRead}`);
          return data;
        }
      };
    }
  };
  await getAdminQueryById(reqGet, resGet);

  // Check read status in DB
  const viewedQuery = await Query.findById(queryId);
  console.log(`Is Admin Read after view: ${viewedQuery.isAdminRead}`);
  if (!viewedQuery.isAdminRead) {
    throw new Error("Query was not marked as read upon viewing!");
  }

  // 4. Test toggleQueryReadStatus (manually mark unread)
  console.log("\n--- Testing toggleQueryReadStatus (Mark as Unread) ---");
  const reqToggleUnread = { params: { id: queryId }, body: { isAdminRead: false } };
  const resToggleUnread = {
    status: (code) => {
      console.log(`[Toggle Unread] Response status: ${code}`);
      return {
        json: (data) => {
          console.log(`[Toggle Unread] Is Admin Read response: ${data.query.isAdminRead}`);
          return data;
        }
      };
    }
  };
  await toggleQueryReadStatus(reqToggleUnread, resToggleUnread);

  // Check read status in DB
  const toggledQuery = await Query.findById(queryId);
  if (toggledQuery.isAdminRead) {
    throw new Error("Query read status toggle failed!");
  }

  // 5. Test replyAdminQuery (adds to history, includes ref ID in reply)
  console.log("\n--- Testing replyAdminQuery & History Log ---");
  const reqReply = {
    params: { id: queryId },
    body: { reply: "This is the first admin response to your test query." }
  };
  const resReply = {
    status: (code) => {
      console.log(`[Reply Query] Response status: ${code}`);
      return {
        json: (data) => {
          console.log(`[Reply Query] Response message:`, data.message);
          return data;
        }
      };
    }
  };
  await replyAdminQuery(reqReply, resReply);

  // Test secondary reply to check history appending
  console.log("\n--- Testing replyAdminQuery Second Reply ---");
  const reqReply2 = {
    params: { id: queryId },
    body: { reply: "This is a secondary admin response to check history appending." }
  };
  await replyAdminQuery(reqReply2, resReply);

  // Check DB for replies history
  const finalQuery = await Query.findById(queryId);
  console.log("\n--- Final Query Replies History ---");
  console.log(JSON.stringify(finalQuery.replies, null, 2));
  
  if (finalQuery.replies.length !== 2) {
    throw new Error("Reply history length mismatch!");
  }

  const dbSuccess = finalQuery.referenceId && finalQuery.replies.length === 2 && finalQuery.acknowledgementEmailStatus === "DELIVERED";
  const ackSuccess = finalQuery.acknowledgementEmailStatus === "DELIVERED";
  const replySuccess = finalQuery.replies.every(r => r.emailStatus === "DELIVERED");

  console.log("\n========================================");
  console.log("          VERIFICATION RESULTS          ");
  console.log("========================================");
  console.log(`Acknowledgement Email: ${ackSuccess ? "SUCCESS" : "FAILED"}`);
  console.log(`Admin Reply Email: ${replySuccess ? "SUCCESS" : "FAILED"}`);
  console.log(`MongoDB Update: ${dbSuccess ? "SUCCESS" : "FAILED"}`);
  console.log("========================================\n");

  if (!ackSuccess || !replySuccess) {
    console.log("⚠️ One or more email steps failed. Please check:");
    console.log(`1. EMAIL_USER is configured: ${process.env.EMAIL_USER ? "YES (" + process.env.EMAIL_USER + ")" : "NO"}`);
    console.log(`2. EMAIL_PASS is configured: ${process.env.EMAIL_PASS ? "YES" : "NO"}`);
    console.log("3. Gmail App Password configuration: If using Gmail, you must generate a 16-character App Password (not your standard login password) from Google Account Security.");
  }

  process.exit(0);
};

runVerification().catch(err => {
  console.error("\n❌ Verification Failed:", err);
  console.log("\n⚠️ SMTP Troubleshooting Checklist:");
  console.log(`- EMAIL_USER: ${process.env.EMAIL_USER || "NOT CONFIGURED"}`);
  console.log(`- EMAIL_PASS: ${process.env.EMAIL_PASS ? "CONFIGURED (Hidden)" : "NOT CONFIGURED"}`);
  console.log("- Verify that Gmail App Passwords are enabled on your account.");
  console.log("- Make sure you have active internet connection and port 465/587 are not blocked.");
  process.exit(1);
});
