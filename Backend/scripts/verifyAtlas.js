import dotenv from "dotenv";
import dns from "dns";
import mongoose from "mongoose";

import connectDB from "../config/db.js";

dotenv.config();

const placeholderPattern = /(YOUR_ATLAS_USERNAME|YOUR_ATLAS_PASSWORD|<USERNAME>|<PASSWORD>)/i;

const getAtlasHost = () => {
  const mongoUri = process.env.MONGO_URI || "";
  const match = mongoUri.match(/^mongodb\+srv:\/\/[^@]+@([^/?]+)/i);
  return match?.[1] || null;
};

const verifyEnv = () => {
  const mongoUri = process.env.MONGO_URI || "";
  const fallbackUri = process.env.MONGO_URI_FALLBACK || "";

  console.log(`MONGO_URI configured: ${Boolean(mongoUri)}`);
  console.log(`MONGO_URI has real-looking credentials: ${Boolean(mongoUri && !placeholderPattern.test(mongoUri))}`);
  console.log(`MONGO_URI_FALLBACK configured: ${Boolean(fallbackUri)}`);
  console.log(`MONGO_URI_FALLBACK has real-looking credentials: ${Boolean(fallbackUri && !placeholderPattern.test(fallbackUri))}`);
};

const verifySrvDns = async () => {
  const atlasHost = getAtlasHost();

  if (!atlasHost) {
    console.log("Atlas SRV DNS skipped: MONGO_URI is not an Atlas SRV URI");
    return;
  }

  const srvRecord = `_mongodb._tcp.${atlasHost}`;

  try {
    const srvRecords = await dns.promises.resolveSrv(srvRecord);
    console.log(`Node SRV DNS resolved ${srvRecord}: ${srvRecords.length} records`);
  } catch (error) {
    console.error(`Node SRV DNS failed for ${srvRecord}: ${error.code || error.message}`);
  }

  try {
    const txtRecords = await dns.promises.resolveTxt(atlasHost);
    console.log(`Node TXT DNS resolved ${atlasHost}: ${txtRecords.length} records`);
  } catch (error) {
    console.error(`Node TXT DNS failed for ${atlasHost}: ${error.code || error.message}`);
  }
};

const verifyDatabaseUserPermissions = async () => {
  await mongoose.connection.db.admin().ping();

  const checkCollection = mongoose.connection.db.collection("payments");
  const result = await checkCollection.insertOne({
    createdAt: new Date(),
    purpose: "atlas-read-write-check",
    temporary: true,
  });

  await checkCollection.deleteOne({ _id: result.insertedId });
  console.log("Database user read/write permission verified");
};

try {
  verifyEnv();
  await verifySrvDns();
  await connectDB();
  await verifyDatabaseUserPermissions();

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map((collection) => collection.name).sort();

  console.log("MongoDB Atlas verification complete");
  console.log(`Database: ${mongoose.connection.name}`);
  console.log(`Collections: ${collectionNames.join(", ")}`);

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error("MongoDB Atlas verification failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
