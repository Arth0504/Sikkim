import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Package from "../models/Package.js";
import Monastery from "../models/Monastery.js";
import Festival from "../models/Festival.js";
import Driver from "../models/Driver.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import FestivalReminder from "../models/FestivalReminder.js";

dotenv.config();

const seedData = async () => {
  try {
    console.log("Connecting to database for seeding...");
    await connectDB();
    console.log("Database connected. Cleaning existing records...");

    // Clear collections (except admin user to preserve login credentials)
    await User.deleteMany({ role: { $ne: "admin" } });
    await Package.deleteMany({});
    await Monastery.deleteMany({});
    await Festival.deleteMany({});
    await Driver.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await FestivalReminder.deleteMany({});

    console.log("Collections cleared successfully.");

    // 1. SEED USERS
    console.log("Seeding Users...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("user123", salt);
    const users = await User.create([
      { name: "John Doe", email: "john@example.com", password: hashedPassword, provider: "local", role: "user", isBlocked: false },
      { name: "Alice Smith", email: "alice@example.com", password: hashedPassword, provider: "local", role: "user", isBlocked: false },
      { name: "Bob Johnson", email: "bob@example.com", provider: "google", role: "user", isBlocked: false },
      { name: "Karma Wangdi", email: "karma@example.com", password: hashedPassword, provider: "local", role: "user", isBlocked: true }
    ]);

    // 2. SEED MONASTERIES
    console.log("Seeding Monasteries...");
    const monasteries = await Monastery.create([
      { name: "Rumtek Monastery", location: "Gangtok, East Sikkim", history: "Dharma Chakra Centre", rules: "Dress conservatively", featured: true },
      { name: "Pemayangtse Monastery", location: "Pelling, West Sikkim", history: "Perfect Sublime Lotus", rules: "No photography inside", featured: true },
      { name: "Lachen Monastery", location: "Lachen, North Sikkim", history: "Nyingma Buddhist sanctuary", rules: "Remove shoes at entry", featured: true },
      { name: "Ralang Monastery", location: "Ravangla, South Sikkim", history: "Sacred Kagyu sect seat", rules: "Silence during prayers", featured: false }
    ]);

    // 3. SEED PACKAGES
    console.log("Seeding Packages...");
    const packages = await Package.create([
      {
        name: "North Sikkim Alpine Adventure",
        description: "Explore high alpine lakes, valleys of flowers, and peaceful monasteries of Lachen & Lachung.",
        duration: "5 Days / 4 Nights",
        price: 18500,
        monasteries: [monasteries[2]._id],
        difficulty: "Hard",
        accommodation: "Guest House",
        meals: "All meals included",
        transport: "Premium SUV",
        compareCount: 12,
        isActive: true
      },
      {
        name: "Rumtek & Gangtok Spiritual Tour",
        description: "Visit Sikkim's most iconic Rumtek Monastery and enjoy scenic Gangtok ropeway vistas.",
        duration: "4 Days / 3 Nights",
        price: 12000,
        monasteries: [monasteries[0]._id],
        difficulty: "Easy",
        accommodation: "3 Star Hotel",
        meals: "Breakfast Included",
        transport: "Private Sedan",
        compareCount: 18,
        isActive: true
      },
      {
        name: "West Sikkim Heritage Trail",
        description: "Rich cultural journey showcasing Pemayangtse Monastery and Khecheopalri Lake.",
        duration: "6 Days / 5 Nights",
        price: 16500,
        monasteries: [monasteries[1]._id],
        difficulty: "Moderate",
        accommodation: "Standard Hotel",
        meals: "Breakfast & Dinner",
        transport: "Shared SUV",
        compareCount: 9,
        isActive: true
      },
      {
        name: "South Sikkim Scenic Retreat",
        description: "Relaxing tour featuring Buddha Park of Ravangla and Ralang Monastery.",
        duration: "3 Days / 2 Nights",
        price: 9500,
        monasteries: [monasteries[3]._id],
        difficulty: "Easy",
        accommodation: "Standard Resort",
        meals: "Breakfast Included",
        transport: "Private Cab",
        compareCount: 5,
        isActive: true
      }
    ]);

    // 4. SEED FESTIVALS
    console.log("Seeding Festivals...");
    const festivals = await Festival.create([
      { name: "Saga Dawa Festival", month: "June", date: new Date("2026-06-15"), location: "Gangtok", category: "religious", description: "Celebrating Buddha's birth, enlightenment, and nirvana." },
      { name: "Pang Lhabsol Festival", month: "September", date: new Date("2026-09-08"), location: "Ravangla", category: "cultural", description: "Paying homage to Mount Kanchenjunga." },
      { name: "Losar Tibetan New Year", month: "February", date: new Date("2026-02-17"), location: "Pelling", category: "traditional", description: "Tibetan New Year celebrations." }
    ]);

    // 5. SEED DRIVERS
    console.log("Seeding Drivers...");
    const drivers = await Driver.create([
      { name: "Dorjee Sherpa", phone: "+91 9800123456", vehicleNumber: "SK-01-T-1234", vehicleType: "Innova", status: "available" },
      { name: "Karma Bhutia", phone: "+91 9800234567", vehicleNumber: "SK-02-T-5678", vehicleType: "Bolero", status: "busy" },
      { name: "Pemba Lepcha", phone: "+91 9800345678", vehicleNumber: "SK-03-T-9012", vehicleType: "Xylo", status: "available" }
    ]);

    // 6. SEED REVIEWS
    console.log("Seeding Reviews...");
    await Review.create([
      { package: packages[0]._id, user: users[0]._id, rating: 5, comment: "Breathtaking views and peaceful monasteries!", isApproved: true },
      { package: packages[0]._id, user: users[1]._id, rating: 4, comment: "Great guide, but the road was bumpy.", isApproved: true },
      { package: packages[1]._id, user: users[0]._id, rating: 5, comment: "Rumtek is spiritually uplifting.", isApproved: true },
      { package: packages[2]._id, user: users[2]._id, rating: 4.5, comment: "Loved the heritage sites.", isApproved: true },
      { package: packages[3]._id, user: users[1]._id, rating: 2, comment: "Too short, wanted to explore more.", isApproved: true } // low booking high rating test trigger
    ]);

    // 7. SEED BOOKINGS & PAYMENTS (With monthly timeline distributions for Analytics)
    console.log("Seeding Bookings & Payments...");
    
    // Monthly configurations to simulate seasonality (Peak July & Oct/Nov)
    const bookingDates = [
      { date: new Date("2026-01-10"), amount: 12000, pkg: packages[1], user: users[0] },
      { date: new Date("2026-02-14"), amount: 16500, pkg: packages[2], user: users[1] },
      { date: new Date("2026-03-12"), amount: 9500, pkg: packages[3], user: users[2] },
      { date: new Date("2026-04-18"), amount: 18500, pkg: packages[0], user: users[0] },
      { date: new Date("2026-05-22"), amount: 12000, pkg: packages[1], user: users[1] },
      { date: new Date("2026-06-05"), amount: 18500, pkg: packages[0], user: users[2] },
      
      // Peak Season July bookings
      { date: new Date("2026-07-02"), amount: 18500, pkg: packages[0], user: users[0] },
      { date: new Date("2026-07-12"), amount: 18500, pkg: packages[0], user: users[1] },
      { date: new Date("2026-07-18"), amount: 16500, pkg: packages[2], user: users[2] },
      { date: new Date("2026-07-25"), amount: 12000, pkg: packages[1], user: users[0] },
      
      // Autumn Peak bookings
      { date: new Date("2026-10-10"), amount: 18500, pkg: packages[0], user: users[1] },
      { date: new Date("2026-10-15"), amount: 16500, pkg: packages[2], user: users[2] },
      { date: new Date("2026-11-05"), amount: 18500, pkg: packages[0], user: users[0] },
      { date: new Date("2026-11-20"), amount: 12000, pkg: packages[1], user: users[1] }
    ];

    for (const bConf of bookingDates) {
      const booking = await Booking.create({
        user: bConf.user._id,
        package: bConf.pkg._id,
        firstName: bConf.user.name.split(" ")[0],
        lastName: bConf.user.name.split(" ")[1] || "Tourist",
        mobile: "9800098000",
        age: 28,
        address: "Sikkim Travel Base",
        idProofNumber: "PAP-12345",
        travelStartDate: bConf.date,
        persons: 1,
        totalAmount: bConf.amount,
        bookingStatus: "confirmed",
        paymentStatus: "paid",
        driver: drivers[0]._id, // assign Dorjee
        createdAt: bConf.date
      });

      await Payment.create({
        user: bConf.user._id,
        booking: booking._id,
        amount: bConf.amount,
        status: "success",
        createdAt: bConf.date
      });
    }

    // 8. SEED FESTIVAL REMINDERS
    console.log("Seeding Festival Reminders...");
    await FestivalReminder.create([
      { user: users[0]._id, festival: festivals[0]._id, email: users[0].email, subscribed: true },
      { user: users[1]._id, festival: festivals[0]._id, email: users[1].email, subscribed: true },
      { user: users[2]._id, festival: festivals[1]._id, email: users[2].email, subscribed: true }
    ]);

    console.log("\n✅ [SEED SUCCESS] Local MongoDB database seeded with full spiritual tour records!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seedData();
