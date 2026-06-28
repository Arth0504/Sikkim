import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

// ROUTES
import emailRoutes from "./routes/emailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import monasteryRoutes from "./routes/monasteryRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import festivalRoutes from "./routes/festivalRoutes.js";
import cancellationPolicyRoutes from "./routes/cancellationPolicyRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import festivalReminderRoutes from "./routes/festivalReminderRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";

// SEED
import createAdmin from "./seed/adminSeed.js";

dotenv.config();

const app = express();

// __dirname fix (ES module me nahi hota)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= MIDDLEWARE =================
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ================= ROUTES =================
app.use("/api/users", userRoutes);
app.use("/api/monasteries", monasteryRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/festivals", festivalRoutes);
app.use("/api/policy", cancellationPolicyRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/reminders", festivalReminderRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api", emailRoutes);

// ================= ADMIN =================
app.use("/api/admin", adminRoutes);

// ================= SERVER STARTUP & PORTS =================
const PORT = process.env.PORT || 8519;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const startServer = async () => {
  try {
    await connectDB();
    await createAdmin();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    httpServer.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ [SERVER ERROR] Port ${PORT} is already in use by another process.`);
        process.exit(1);
      } else {
        console.error("Server error:", error.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
